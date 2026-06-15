import mongoose from 'mongoose'
import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

let memoryServer = null

/**
 * Connect to MongoDB.
 * - If MONGODB_URI is set (Atlas or local), use it.
 * - Otherwise spin up an embedded MongoDB (mongodb-memory-server) persisted
 *   under server/data, so the app runs with zero setup.
 */
export async function connectDB() {
  let uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim()

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server')
    const dbPath = path.resolve(__dirname, '../data')
    fs.mkdirSync(dbPath, { recursive: true })
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: 'sales-crm', dbPath, storageEngine: 'wiredTiger' },
    })
    uri = memoryServer.getUri('sales-crm')
    console.log('[db] No MONGODB_URI set — using embedded MongoDB (persisted in server/data).')
    console.log('[db] To use MongoDB Atlas, set MONGODB_URI in server/.env')
  }

  mongoose.set('strictQuery', true)
  mongoose.connection.on('error', (e) => console.error('[db] connection error:', e.message))

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
  } catch (err) {
    if (/bad auth|authentication failed/i.test(err.message)) {
      console.error('\n[db] Authentication failed — the username/password in MONGODB_URI does not match your Atlas database user.')
      console.error('     • Check Atlas → Database Access for the exact username & password.')
      console.error('     • If the password has special characters (@ : / ? # %), URL-encode them (e.g. @ → %40).')
      console.error('     • Tip: reset the DB user to an alphanumeric password to avoid encoding issues.\n')
    } else if (/ENOTFOUND|querySrv/i.test(err.message)) {
      console.error('\n[db] Could not resolve the cluster host — check the cluster address in MONGODB_URI.\n')
    }
    throw err
  }
  console.log(`[db] Connected → ${mongoose.connection.host}/${mongoose.connection.name}`)
}

export async function disconnectDB() {
  await mongoose.disconnect()
  if (memoryServer) await memoryServer.stop()
}
