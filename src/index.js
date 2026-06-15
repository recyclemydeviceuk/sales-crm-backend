import 'dotenv/config'
import { connectDB } from './db.js'
import { createApp } from './app.js'
import { ensureSeeded } from './seedData.js'

const PORT = process.env.PORT || 4000

async function start() {
  await connectDB()
  await ensureSeeded()
  const app = createApp()
  app.listen(PORT, () => {
    console.log(`[api] Sales CRM API ready → http://localhost:${PORT}/api`)
  })
}

start().catch((err) => {
  console.error('[fatal] Failed to start server:', err)
  process.exit(1)
})
