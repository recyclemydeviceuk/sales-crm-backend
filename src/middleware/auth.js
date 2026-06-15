import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const getSecret = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set in the environment')
  return s
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// Require a valid Bearer token; attaches req.user.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    const payload = jwt.verify(token, getSecret())
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'Account no longer exists' })

    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}
