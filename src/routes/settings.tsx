import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
  ArrowDown,
  ArrowUp,
  BellRing,
  Check,
  LoaderCircle,
  Pin,
  Save,
  Trash2,
} from 'lucide-react'
import { api } from 'convex/_generated/api'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
  ssr: false,
})

const days = [
  { value: 'monday', label: 'MON', name: 'Monday', cron: 1 },
  { value: 'tuesday', label: 'TUE', name: 'Tuesday', cron: 2 },
  { value: 'wednesday', label: 'WED', name: 'Wednesday', cron: 3 },
  { value: 'thursday', label: 'THU', name: 'Thursday', cron: 4 },
  { value: 'friday', label: 'FRI', name: 'Friday', cron: 5 },
  { value: 'saturday', label: 'SAT', name: 'Saturday', cron: 6 },
  { value: 'sunday', label: 'SUN', name: 'Sunday', cron: 0 },
]

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12

  return {
    value: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    label: `${hour12}:${String(minute).padStart(2, '0')} ${meridiem}`,
    hour,
    minute,
  }
})

function scheduleFromUTC(schedule: {
  weekdays: Array<number>
  hourUTC: number
  minuteUTC: number
}) {
  const localDate = new Date()
  localDate.setUTCHours(schedule.hourUTC, schedule.minuteUTC, 0, 0)
  const weekdayOffset = (localDate.getDay() - localDate.getUTCDay() + 7) % 7

  return {
    weekdays: schedule.weekdays.map((weekday) => (weekday + weekdayOffset) % 7),
    hour: localDate.getHours(),
    minute: localDate.getMinutes(),
  }
}

function SettingsPage() {
  const settings = useQuery(api.settings.get)
  const saveSettingsMutation = useMutation(api.settings.saveSettings)
  const movePinnedGame = useMutation(api.settings.movePinnedGame)
  const unpinGame = useMutation(api.settings.unpinGame)
  const [selectedDays, setSelectedDays] = useState<Array<string>>([])
  const [time, setTime] = useState('20:30')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [updatingPinnedGameId, setUpdatingPinnedGameId] = useState<
    number | null
  >(null)
  const [pinnedGameError, setPinnedGameError] = useState<string | null>(null)

  useEffect(() => {
    if (!settings) return
    const localSchedule = scheduleFromUTC(settings.priceCheckSchedule)
    setSelectedDays(
      days
        .filter((day) => localSchedule.weekdays.includes(day.cron))
        .map((day) => day.value),
    )
    setTime(
      `${String(localSchedule.hour).padStart(2, '0')}:${String(localSchedule.minute).padStart(2, '0')}`,
    )
  }, [settings?._id])

  const selectedTime =
    timeOptions.find((option) => option.value === time) ?? timeOptions[0]
  const cronDays = useMemo(
    () =>
      days
        .filter((day) => selectedDays.includes(day.value))
        .map((day) => day.cron)
        .sort((a, b) => a - b),
    [selectedDays],
  )
  async function saveSettings() {
    if (cronDays.length === 0) return

    setIsSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      const selectedLocalTime = new Date()
      selectedLocalTime.setHours(selectedTime.hour, selectedTime.minute, 0, 0)
      await saveSettingsMutation({
        settings: {
          priceCheckSchedule: {
            weekdays: cronDays,
            hour: selectedTime.hour,
            minute: selectedTime.minute,
            utcOffsetMinutes: selectedLocalTime.getTimezoneOffset(),
          },
        },
      })
      setSaved(true)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Unable to save the schedule.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function updatePinnedGame(
    categoryId: number,
    update: () => Promise<unknown>,
  ) {
    setUpdatingPinnedGameId(categoryId)
    setPinnedGameError(null)
    try {
      await update()
    } catch (error) {
      setPinnedGameError(
        error instanceof Error
          ? error.message
          : 'Unable to update pinned games.',
      )
    } finally {
      setUpdatingPinnedGameId(null)
    }
  }

  const pinnedGames = settings?.pinnedGames ?? []

  return (
    <main className="min-h-[calc(100vh-72px)] bg-linear-to-b from-violet-100 via-purple-50 to-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 id="page-title" className="text-3xl font-bold tracking-tight">
              Settings
            </h1>
          </div>
        </header>

        <section
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
          aria-labelledby="alerts-heading"
        >
          <div className="flex items-start gap-4 border-b bg-muted/30 px-6 py-5">
            <div className="rounded-lg bg-violet-100 p-2.5 text-violet-700">
              <BellRing className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="alerts-heading" className="font-semibold">
                Price alerts
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set when tracked products are checked and Discord alerts are
                sent.
              </p>
            </div>
          </div>

          {!settings ? (
            <div
              className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground"
              role="status"
            >
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading schedule…
            </div>
          ) : (
            <div className="p-6">
              <h3 className="mb-6 font-medium">Price check schedule</h3>

              <div className="grid gap-7">
                <div>
                  <p className="mb-3 text-sm font-medium">Days to check</p>
                  <ToggleGroup
                    type="multiple"
                    value={selectedDays}
                    onValueChange={(value) => {
                      setSelectedDays(value)
                      setSaved(false)
                    }}
                    className="flex flex-wrap gap-2"
                    aria-label="Days of the week"
                  >
                    {days.map((day) => (
                      <ToggleGroupItem
                        key={day.value}
                        value={day.value}
                        aria-label={day.name}
                        className="h-11 w-11 rounded-md border border-input bg-background text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[state=on]:border-violet-600 data-[state=on]:bg-violet-600 data-[state=on]:text-white data-[state=on]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                      >
                        {day.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div>
                  <label
                    htmlFor="schedule-time"
                    className="mb-2 block text-sm font-medium"
                  >
                    Time (local)
                  </label>
                  <select
                    id="schedule-time"
                    value={time}
                    onChange={(event) => {
                      setTime(event.target.value)
                      setSaved(false)
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  >
                    {timeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {saveError ? (
                    <p className="text-sm text-destructive">{saveError}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Changes take effect as soon as you save.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => void saveSettings()}
                  disabled={isSaving || cronDays.length === 0}
                >
                  {isSaving ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving…' : saved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section
          className="mt-6 overflow-hidden rounded-xl border bg-card shadow-sm"
          aria-labelledby="pinned-games-heading"
        >
          <div className="flex items-start gap-4 border-b bg-muted/30 px-6 py-5">
            <div className="rounded-lg bg-violet-100 p-2.5 text-violet-700">
              <Pin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="pinned-games-heading" className="font-semibold">
                Pinned games
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the order games appear in the navigation menu.
              </p>
            </div>
          </div>

          {!settings ? (
            <div
              className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground"
              role="status"
            >
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading pinned games…
            </div>
          ) : pinnedGames.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              Pin a game from its sets page to add it here.
            </p>
          ) : (
            <div className="p-4 sm:p-6">
              <ol className="divide-y rounded-lg border">
                {pinnedGames.map((game, index) => {
                  const isUpdating = updatingPinnedGameId === game.categoryId
                  return (
                    <li
                      key={game.categoryId}
                      className="flex items-center gap-3 px-3 py-3 sm:px-4"
                    >
                      <span className="w-5 text-center text-sm tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {game.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Move ${game.name} up`}
                          title="Move up"
                          disabled={index === 0 || isUpdating}
                          onClick={() =>
                            void updatePinnedGame(game.categoryId, () =>
                              movePinnedGame({
                                categoryId: game.categoryId,
                                direction: 'up',
                              }),
                            )
                          }
                          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${game.name} down`}
                          title="Move down"
                          disabled={
                            index === pinnedGames.length - 1 || isUpdating
                          }
                          onClick={() =>
                            void updatePinnedGame(game.categoryId, () =>
                              movePinnedGame({
                                categoryId: game.categoryId,
                                direction: 'down',
                              }),
                            )
                          }
                          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        >
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${game.name} from pinned games`}
                          title="Remove pin"
                          disabled={isUpdating}
                          onClick={() =>
                            void updatePinnedGame(game.categoryId, () =>
                              unpinGame({ categoryId: game.categoryId }),
                            )
                          }
                          className="rounded-md p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
              {pinnedGameError ? (
                <p className="mt-3 text-sm text-destructive" role="alert">
                  {pinnedGameError}
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
