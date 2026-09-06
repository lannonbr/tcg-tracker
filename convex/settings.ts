import { Crons } from '@convex-dev/crons'
import { v } from 'convex/values'
import { components, internal } from './_generated/api'
import { internalMutation, mutation, query } from './_generated/server'

const crons = new Crons(components.crons)

const PRICE_CHECK_CRON_NAME = 'check-prices-and-send-discord-notifications'

// Default is every day at 8:30pm UTC. (as the TCGCSV data refreshes at 8:00pm UTC)
const DEFAULT_PRICE_CHECK_SCHEDULE = {
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  hourUTC: 20,
  minuteUTC: 30,
}

const localScheduleValidator = v.object({
  weekdays: v.array(v.number()),
  hour: v.number(),
  minute: v.number(),
  utcOffsetMinutes: v.number(),
})

const settingsValidator = v.object({
  priceCheckSchedule: localScheduleValidator,
})

type PriceCheckSchedule = typeof DEFAULT_PRICE_CHECK_SCHEDULE
type LocalPriceCheckSchedule = {
  weekdays: Array<number>
  hour: number
  minute: number
  utcOffsetMinutes: number
}

function normalizeSchedule(schedule: PriceCheckSchedule): PriceCheckSchedule {
  if (
    !Number.isInteger(schedule.hourUTC) ||
    schedule.hourUTC < 0 ||
    schedule.hourUTC > 23
  ) {
    throw new Error('The schedule hour must be between 0 and 23.')
  }
  if (
    !Number.isInteger(schedule.minuteUTC) ||
    schedule.minuteUTC < 0 ||
    schedule.minuteUTC > 59
  ) {
    throw new Error('The schedule minute must be between 0 and 59.')
  }

  const weekdays = [...new Set(schedule.weekdays)].sort((a, b) => a - b)
  if (weekdays.length === 0) {
    throw new Error('Select at least one day for the price-check schedule.')
  }
  if (weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new Error(
      'Weekdays must be numbered from 0 (Sunday) through 6 (Saturday).',
    )
  }

  return { ...schedule, weekdays }
}

function toCronSpec({
  weekdays,
  hourUTC,
  minuteUTC,
}: PriceCheckSchedule): string {
  return `${minuteUTC} ${hourUTC} * * ${weekdays.join(',')}`
}

function localScheduleToUTC(
  localSchedule: LocalPriceCheckSchedule,
): PriceCheckSchedule {
  const localScheduleWithValidatedDays = normalizeSchedule({
    weekdays: localSchedule.weekdays,
    hourUTC: localSchedule.hour,
    minuteUTC: localSchedule.minute,
  })

  if (
    !Number.isInteger(localSchedule.utcOffsetMinutes) ||
    localSchedule.utcOffsetMinutes < -840 ||
    localSchedule.utcOffsetMinutes > 840
  ) {
    throw new Error('The local UTC offset is invalid.')
  }

  const utcTotalMinutes =
    localSchedule.hour * 60 +
    localSchedule.minute +
    localSchedule.utcOffsetMinutes
  const weekdayOffset = Math.floor(utcTotalMinutes / (24 * 60))
  const utcMinutes = ((utcTotalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)

  return normalizeSchedule({
    weekdays: localScheduleWithValidatedDays.weekdays.map(
      (weekday) => (weekday + weekdayOffset + 7) % 7,
    ),
    hourUTC: Math.floor(utcMinutes / 60),
    minuteUTC: utcMinutes % 60,
  })
}

async function registerPriceCheckCron(
  ctx: Parameters<typeof crons.register>[0],
  schedule: PriceCheckSchedule,
) {
  await crons.register(
    ctx,
    { kind: 'cron', cronspec: toCronSpec(schedule), tz: 'UTC' },
    internal.notifications.checkPricesAndNotify,
    {},
    PRICE_CHECK_CRON_NAME,
  )
}

export const get = query({
  args: {},
  handler: async (ctx) => ctx.db.query('settings').first(),
})

export const ensureDefaultSettings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingSettings = await ctx.db.query('settings').first()
    const schedule = normalizeSchedule(
      existingSettings?.priceCheckSchedule ?? DEFAULT_PRICE_CHECK_SCHEDULE,
    )
    const existingCron = await crons.get(ctx, { name: PRICE_CHECK_CRON_NAME })

    if (!existingCron) {
      await registerPriceCheckCron(ctx, schedule)
    }

    if (existingSettings) return existingSettings._id
    return await ctx.db.insert('settings', { priceCheckSchedule: schedule })
  },
})

export const saveSettings = mutation({
  args: { settings: settingsValidator },
  handler: async (ctx, { settings }) => {
    const schedule = localScheduleToUTC(settings.priceCheckSchedule)
    const existingCron = await crons.get(ctx, { name: PRICE_CHECK_CRON_NAME })

    if (existingCron) {
      await crons.delete(ctx, { name: PRICE_CHECK_CRON_NAME })
    }
    await registerPriceCheckCron(ctx, schedule)

    const existingSettings = await ctx.db.query('settings').first()
    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, { priceCheckSchedule: schedule })
      return existingSettings._id
    }
    return await ctx.db.insert('settings', { priceCheckSchedule: schedule })
  },
})
