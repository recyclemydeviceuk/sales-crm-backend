import { Router } from 'express'
import Lead from '../models/Lead.js'
import ListItem from '../models/ListItem.js'
import { asyncHandler } from '../utils.js'

const router = Router()

// GET /api/stats — dashboard aggregates.
router.get('/', asyncHandler(async (req, res) => {
  const [total, byStatusAgg, bySourceAgg, firstStage] = await Promise.all([
    Lead.countDocuments(),
    Lead.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Lead.aggregate([{ $group: { _id: '$source', n: { $sum: 1 } } }]),
    ListItem.findOne({ type: 'stage' }).sort({ order: 1 }),
  ])

  const byStatus = Object.fromEntries(byStatusAgg.map((x) => [x._id || '', x.n]))
  const bySource = Object.fromEntries(bySourceAgg.filter((x) => x._id).map((x) => [x._id, x.n]))

  const firstName = firstStage?.name
  const newCount = byStatus[firstName] || 0
  const contacted = total - newCount
  const converted = byStatus['Converted'] || 0
  const interested = (byStatus['Interested'] || 0) + converted

  res.json({
    total,
    byStatus,
    bySource,
    contacted,
    interested,
    converted,
    contactRate: total ? Math.round((contacted / total) * 100) : 0,
    conversionRate: contacted ? Math.round((converted / contacted) * 100) : 0,
  })
}))

export default router
