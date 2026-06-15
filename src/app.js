import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import auth from './routes/auth.js'
import leads from './routes/leads.js'
import lists from './routes/lists.js'
import settings from './routes/settings.js'
import stats from './routes/stats.js'
import { requireAuth } from './middleware/auth.js'

export function createApp() {
  const app = express()

  // Restrict to CLIENT_ORIGIN if set (e.g. your deployed frontend); otherwise allow all (dev).
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }))
  app.use(express.json({ limit: '4mb' }))
  app.use(morgan('dev'))

  app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }))

  // Public auth routes (login / register / me).
  app.use('/api/auth', auth)

  // Everything below requires a valid session.
  app.use('/api/leads', requireAuth, leads)
  app.use('/api/lists', requireAuth, lists)
  app.use('/api/settings', requireAuth, settings)
  app.use('/api/stats', requireAuth, stats)

  // 404 + error handler
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[error]', err.message)
    const code = err.name === 'CastError' ? 400 : err.status || 500
    res.status(code).json({ error: err.message || 'Server error' })
  })

  return app
}
