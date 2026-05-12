require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const sequelize = require('./db')
require('./models')

const authRoutes = require('./routes/auth')
const vehicleRoutes = require('./routes/vehicles')
const tripRoutes = require('./routes/trips')
const bookingRoutes = require('./routes/bookings')

const app = express()
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins,
  }),
)
app.use(express.json({ limit: '5mb' }))

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
})

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/bookings', bookingRoutes)

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  return res.status(500).json({ success: false, message: err.message || 'Server error' })
})

const PORT = process.env.PORT || 3000

async function start() {
  try {
    await sequelize.authenticate()
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`FleetTrack API running on http://localhost:${PORT}`)
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database connection failed:', error.message)
    process.exit(1)
  }
}

start()
