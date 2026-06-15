// Wrap async route handlers so rejected promises hit the error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// Escape a user string for safe use inside a RegExp.
export const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Keep only known lead fields from a request body.
import { LEAD_FIELDS } from './defaults.js'
export const pickLead = (body = {}) => {
  const out = {}
  for (const k of LEAD_FIELDS) if (k in body) out[k] = body[k]
  return out
}
