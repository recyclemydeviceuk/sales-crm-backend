import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import Lead from './models/Lead.js'
import ListItem from './models/ListItem.js'
import Setting from './models/Setting.js'
import Counter from './models/Counter.js'
import { DEFAULT_STAGES } from './defaults.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
// The frontend's data files are the single source of truth for the seed.
const dataDir = path.resolve(__dirname, '../../src/data')
const readJSON = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'))

export async function reseedLeads() {
  const leads = readJSON('leads.json')
  await Lead.deleteMany({})
  const docs = leads.map((l, i) => ({
    seq: i + 1,
    source: l.source || '',
    dateOfCalling: l.dateOfCalling || '',
    counselor: l.counselor || '',
    college: l.college || '',
    firstName: l.firstName || '',
    lastName: l.lastName || '',
    email: l.email || '',
    city: l.city || '',
    countryCode: l.countryCode || '',
    phone: l.phone || '',
    program: l.program || '',
    callStatus: l.callStatus || '',
    callDisposition: l.callDisposition || '',
    orientationStatus: l.orientationStatus || '',
    remark: l.remark || '',
    status: l.status || 'New',
  }))
  await Lead.insertMany(docs, { ordered: false })
  await Counter.findByIdAndUpdate('leadSeq', { value: leads.length }, { upsert: true })
  return docs.length
}

export async function seedLists() {
  const meta = readJSON('meta.json')
  await ListItem.deleteMany({})
  const items = []
  DEFAULT_STAGES.forEach((s, i) => items.push({ type: 'stage', name: s.name, color: s.color, order: i }))
  meta.sources.forEach((n, i) => items.push({ type: 'source', name: n, order: i }))
  meta.colleges.forEach((n, i) => items.push({ type: 'college', name: n, order: i }))
  meta.cities.forEach((n, i) => items.push({ type: 'city', name: n, order: i }))
  await ListItem.insertMany(items)
  return items.length
}

// Reset a single list type back to its default options.
export async function resetListType(type) {
  await ListItem.deleteMany({ type })
  if (type === 'stage') {
    await ListItem.insertMany(DEFAULT_STAGES.map((s, i) => ({ type: 'stage', name: s.name, color: s.color, order: i })))
  } else {
    const meta = readJSON('meta.json')
    const key = { source: 'sources', college: 'colleges', city: 'cities' }[type]
    await ListItem.insertMany((meta[key] || []).map((n, i) => ({ type, name: n, order: i })))
  }
}

export async function seedSettings() {
  await Setting.findOneAndUpdate(
    { key: 'app' },
    { $setOnInsert: { counselor: 'Counselor', org: 'Hyderabad Team' } },
    { upsert: true },
  )
}

export async function seedAll() {
  const lists = await seedLists()
  const leads = await reseedLeads()
  await seedSettings()
  return { lists, leads }
}

// Seed only if the database is empty (used on server boot).
export async function ensureSeeded() {
  const count = await Lead.estimatedDocumentCount()
  if (count === 0) {
    console.log('[seed] Empty database detected — seeding all data…')
    const { leads, lists } = await seedAll()
    console.log(`[seed] Done — ${leads} leads, ${lists} list options.`)
  }
}
