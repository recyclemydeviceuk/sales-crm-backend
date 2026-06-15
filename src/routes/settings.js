import { Router } from 'express'
import Setting from '../models/Setting.js'
import { asyncHandler } from '../utils.js'

const router = Router()

// GET /api/settings
router.get('/', asyncHandler(async (req, res) => {
  let s = await Setting.findOne({ key: 'app' })
  if (!s) s = await Setting.create({ key: 'app' })
  res.json(s.toJSON())
}))

// PUT /api/settings
router.put('/', asyncHandler(async (req, res) => {
  const { counselor, org } = req.body
  const s = await Setting.findOneAndUpdate(
    { key: 'app' },
    { $set: { counselor: (counselor ?? 'Counselor') || 'Counselor', org: (org ?? 'Team') || 'Team' } },
    { new: true, upsert: true },
  )
  res.json(s.toJSON())
}))

export default router
