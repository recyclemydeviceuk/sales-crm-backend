import { Router } from 'express'
import User from '../models/User.js'
import { asyncHandler } from '../utils.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// POST /api/auth/register — create a CRM user. Gated by ADMIN_SETUP_KEY.
router.post('/register', asyncHandler(async (req, res) => {
  const setupKey = process.env.ADMIN_SETUP_KEY
  if (!setupKey) {
    return res.status(500).json({ error: 'ADMIN_SETUP_KEY is not configured on the server' })
  }
  const { name, email, password, setupKey: provided } = req.body || {}

  if (provided !== setupKey) {
    return res.status(403).json({ error: 'Invalid setup key' })
  }
  if (!isEmail(email || '')) return res.status(400).json({ error: 'A valid email is required' })
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const exists = await User.findOne({ email: email.toLowerCase() })
  if (exists) return res.status(409).json({ error: 'An account with this email already exists' })

  const user = new User({ name: name || '', email, role: 'admin' })
  await user.setPassword(password)
  await user.save()

  const token = signToken(user)
  res.status(201).json({ token, user: user.toJSON() })
}))

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  const user = await User.findOne({ email: String(email).toLowerCase() })
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = signToken(user)
  res.json({ token, user: user.toJSON() })
}))

// GET /api/auth/me — current user from the token.
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: req.user.toJSON() })
}))

export default router
