import 'dotenv/config'
import crypto from 'node:crypto'
import { connectDB, disconnectDB } from './db.js'
import User from './models/User.js'

// Parse simple --flag value CLI args.
function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : undefined
}

async function run() {
  // The setup key must be configured — this is what gates user creation.
  if (!process.env.ADMIN_SETUP_KEY) {
    console.error('\n[seed:admin] ADMIN_SETUP_KEY is not set in server/.env — cannot create users.')
    console.error('             Add ADMIN_SETUP_KEY (and JWT_SECRET) to server/.env first.\n')
    process.exit(1)
  }

  const email = (arg('email') || process.env.ADMIN_EMAIL || '').toLowerCase().trim()
  const name = arg('name') || process.env.ADMIN_NAME || 'Admin'
  let password = arg('password') || process.env.ADMIN_PASSWORD
  let generated = false
  if (!password) {
    password = crypto.randomBytes(6).toString('base64url') // ~8 chars
    generated = true
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('\n[seed:admin] Provide an email via --email <addr> or ADMIN_EMAIL in .env\n')
    process.exit(1)
  }

  await connectDB()

  let user = await User.findOne({ email })
  const action = user ? 'Updated' : 'Created'
  if (!user) user = new User({ email, name, role: 'admin' })
  else if (name) user.name = name
  await user.setPassword(password)
  await user.save()

  console.log('\n────────────────────────────────────────────')
  console.log(`[seed:admin] ${action} admin user`)
  console.log(`  Email    : ${email}`)
  console.log(`  Name     : ${user.name}`)
  if (generated) console.log(`  Password : ${password}   <-- generated, save this`)
  else console.log('  Password : (as provided)')
  console.log('────────────────────────────────────────────\n')

  await disconnectDB()
  process.exit(0)
}

run().catch((err) => {
  console.error('[seed:admin] Failed:', err.message)
  process.exit(1)
})
