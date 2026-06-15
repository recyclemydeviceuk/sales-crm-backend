import { Router } from 'express'
import ListItem from '../models/ListItem.js'
import Lead from '../models/Lead.js'
import { asyncHandler, escapeRegex } from '../utils.js'
import { LIST_TYPES, LIST_FIELD } from '../defaults.js'
import { resetListType } from '../seedData.js'

const router = Router()
const PLURAL = { stage: 'stages', source: 'sources', college: 'colleges', city: 'cities' }

const resolveType = (param) => LIST_TYPES[param] // 'stages' -> 'stage'

// GET /api/lists — every option grouped by list.
router.get('/', asyncHandler(async (req, res) => {
  const items = await ListItem.find().sort({ type: 1, order: 1, name: 1 })
  const out = { stages: [], sources: [], colleges: [], cities: [] }
  for (const it of items) out[PLURAL[it.type]].push(it.toJSON())
  res.json(out)
}))

// POST /api/lists/:type — add an option.
router.post('/:type', asyncHandler(async (req, res) => {
  const type = resolveType(req.params.type)
  if (!type) return res.status(400).json({ error: 'Unknown list type' })
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Name is required' })

  const exists = await ListItem.findOne({ type, name: new RegExp(`^${escapeRegex(name)}$`, 'i') })
  if (exists) return res.status(409).json({ error: `"${name}" already exists` })

  const order = await ListItem.countDocuments({ type })
  const color = type === 'stage' ? req.body.color || '#7585a0' : ''
  const item = await ListItem.create({ type, name, color, order })
  res.status(201).json(item.toJSON())
}))

// POST /api/lists/:type/reset — restore default options for this list.
router.post('/:type/reset', asyncHandler(async (req, res) => {
  const type = resolveType(req.params.type)
  if (!type) return res.status(400).json({ error: 'Unknown list type' })
  await resetListType(type)
  const items = await ListItem.find({ type }).sort({ order: 1 })
  res.json(items.map((i) => i.toJSON()))
}))

// PATCH /api/lists/:type/:id — rename / recolor (renames cascade onto leads).
router.patch('/:type/:id', asyncHandler(async (req, res) => {
  const type = resolveType(req.params.type)
  if (!type) return res.status(400).json({ error: 'Unknown list type' })
  const item = await ListItem.findOne({ _id: req.params.id, type })
  if (!item) return res.status(404).json({ error: 'Item not found' })

  if (type === 'stage' && typeof req.body.color === 'string') item.color = req.body.color

  if (typeof req.body.name === 'string' && req.body.name.trim() && req.body.name.trim() !== item.name) {
    const newName = req.body.name.trim()
    const dup = await ListItem.findOne({ type, name: new RegExp(`^${escapeRegex(newName)}$`, 'i'), _id: { $ne: item._id } })
    if (dup) return res.status(409).json({ error: `"${newName}" already exists` })
    // Cascade the rename onto every lead that references the old value.
    await Lead.updateMany({ [LIST_FIELD[type]]: item.name }, { [LIST_FIELD[type]]: newName })
    item.name = newName
  }

  await item.save()
  res.json(item.toJSON())
}))

// DELETE /api/lists/:type/:id — remove an option.
router.delete('/:type/:id', asyncHandler(async (req, res) => {
  const type = resolveType(req.params.type)
  if (!type) return res.status(400).json({ error: 'Unknown list type' })
  const item = await ListItem.findOne({ _id: req.params.id, type })
  if (!item) return res.status(404).json({ error: 'Item not found' })

  if (type === 'stage') {
    const count = await ListItem.countDocuments({ type: 'stage' })
    if (count <= 1) return res.status(400).json({ error: 'At least one stage is required' })
    // Move leads on this stage to the first remaining stage.
    const fallback = await ListItem.findOne({ type: 'stage', _id: { $ne: item._id } }).sort({ order: 1 })
    await Lead.updateMany({ status: item.name }, { status: fallback.name })
  }

  await item.deleteOne()
  res.json({ ok: true })
}))

export default router
