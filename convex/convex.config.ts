import { defineApp } from 'convex/server'
import cache from '@convex-dev/action-cache/convex.config.js'
import crons from '@convex-dev/crons/convex.config.js'

const app = defineApp()
app.use(cache)
app.use(crons)

export default app
