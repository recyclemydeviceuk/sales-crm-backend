import { Router } from 'express'
import Lead from '../models/Lead.js'
import ListItem from '../models/ListItem.js'
import { nextSeq } from '../models/Counter.js'
import { asyncHandler, escapeRegex, pickLead } from '../utils.js'
import { reseedLeads } from '../seedData.js'

const router = Router()

function buildQuery({ status, source, college, city, search }) {
  const q = {}
  if (status) q.status = status
  if (source) q.source = source
  if (college) q.college = college
  if (city) q.city = city
  if (search) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i')
    q.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }, { college: rx }, { city: rx }]
  }
  return q
}

// GET /api/leads — list with optional filters + pagination.
//   ?all=1 (or ?limit=0) returns every matching lead.
router.get('/', asyncHandler(async (req, res) => {
  const { page = '1', limit = '25', all } = req.query
  const q = buildQuery(req.query)
  const total = await Lead.countDocuments(q)

  let cursor = Lead.find(q).sort({ seq: 1 })
  const lim = parseInt(limit, 10)
  const paginate = !all && lim > 0
  let p = 1
  if (paginate) {
    p = Math.max(1, parseInt(page, 10) || 1)
    cursor = cursor.skip((p - 1) * lim).limit(lim)
  }

  const docs = await cursor
  res.json({
    data: docs.map((d) => d.toJSON()),
    total,
    page: paginate ? p : 1,
    limit: paginate ? lim : total,
    pages: paginate ? Math.max(1, Math.ceil(total / lim)) : 1,
  })
}))

// POST /api/leads/reset — re-import the original lead list (status changes discarded).
router.post('/reset', asyncHandler(async (req, res) => {
  const n = await reseedLeads()
  res.json({ ok: true, leads: n })
}))

// POST /api/leads — create a lead.
router.post('/', asyncHandler(async (req, res) => {
  const body = pickLead(req.body)
  if (!body.firstName?.trim() && !body.lastName?.trim()) {
    return res.status(400).json({ error: 'A first or last name is required.' })
  }
  if (!body.status) {
    const first = await ListItem.findOne({ type: 'stage' }).sort({ order: 1 })
    body.status = first?.name || 'New'
  }
  body.seq = await nextSeq()
  const lead = await Lead.create(body)
  res.status(201).json(lead.toJSON())
}))

// GET /api/leads/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
  if (!lead) return res.status(404).json({ error: 'Lead not found' })
  res.json(lead.toJSON())
}))

// PATCH /api/leads/:id — update any subset of fields.
router.patch('/:id', asyncHandler(async (req, res) => {
  const changes = pickLead(req.body)
  const lead = await Lead.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true })
  if (!lead) return res.status(404).json({ error: 'Lead not found' })
  res.json(lead.toJSON())
}))

// DELETE /api/leads/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id)
  if (!lead) return res.status(404).json({ error: 'Lead not found' })
  res.json({ ok: true })
}))

export default router
