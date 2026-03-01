import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Run daily at 8:30pm UTC (3:30pm ET) — after the 3pm ET TCGCSV data cycle
crons.daily(
  'check prices and send discord notifications',
  { hourUTC: 20, minuteUTC: 30 },
  internal.notifications.checkPricesAndNotify,
)

export default crons
