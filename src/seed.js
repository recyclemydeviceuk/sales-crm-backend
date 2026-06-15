import 'dotenv/config'
import { connectDB, disconnectDB } from './db.js'
import { seedAll } from './seedData.js'

async function run() {
  await connectDB()
  console.log('[seed] Seeding all data (this clears and re-imports leads + lists)…')
  const { leads, lists } = await seedAll()
  console.log(`[seed] Complete — ${leads} leads, ${lists} list options.`)
  await disconnectDB()
  process.exit(0)
}

run().catch((err) => {
  console.error('[seed] Failed:', err)
  process.exit(1)
})
