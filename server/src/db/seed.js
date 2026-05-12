require('dotenv').config()
const bcrypt = require('bcryptjs')
const sequelize = require('./index')
const { User, Vehicle, Booking, Compliance } = require('../models')

async function seed() {
  await sequelize.sync({ force: true })

  const password_hash = await bcrypt.hash('password123', 10)
  const users = await User.bulkCreate([
    { name: 'System Admin', email: 'admin@fleet.com', role: 'admin', password_hash },
    { name: 'Fleet Manager', email: 'manager@fleet.com', role: 'manager', password_hash },
    { name: 'John Driver', email: 'john@fleet.com', role: 'driver', password_hash },
    { name: 'Mary Driver', email: 'mary@fleet.com', role: 'driver', password_hash },
  ])

  const vehicles = await Vehicle.bulkCreate([
    { registration_number: 'ABC 123 GP', make: 'Toyota', model: 'HiLux', status: 'available', odometer_current: 145230 },
    { registration_number: 'XYZ 456 GP', make: 'Ford', model: 'Ranger', status: 'available', odometer_current: 120200 },
    { registration_number: 'DEF 789 GP', make: 'VW', model: 'Transporter', status: 'service', odometer_current: 231450 },
    { registration_number: 'MNO 321 GP', make: 'Toyota', model: 'Corolla', status: 'available', odometer_current: 85900 },
  ])

  const today = new Date()
  const in20 = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
  const in50 = new Date(Date.now() + 50 * 24 * 60 * 60 * 1000)

  await Compliance.bulkCreate([
    { vehicle_id: vehicles[0].id, type: 'insurance', due_date: in50, status: 'warning' },
    { vehicle_id: vehicles[1].id, type: 'service', due_date: in20, status: 'warning' },
    { vehicle_id: vehicles[2].id, type: 'registration', due_date: today, status: 'urgent' },
    { vehicle_id: vehicles[3].id, type: 'safety', due_date: in50, status: 'ok' },
  ])

  await Booking.bulkCreate([
    {
      vehicle_id: vehicles[0].id,
      driver_id: users[2].id,
      date_from: new Date(Date.now() + 60 * 60 * 1000),
      date_to: new Date(Date.now() + 5 * 60 * 60 * 1000),
      purpose: 'Client visit',
      usage_type: 'business',
      status: 'approved',
    },
    {
      vehicle_id: vehicles[1].id,
      driver_id: users[3].id,
      date_from: new Date(Date.now() + 24 * 60 * 60 * 1000),
      date_to: new Date(Date.now() + 27 * 60 * 60 * 1000),
      purpose: 'Site inspection',
      usage_type: 'business',
      status: 'approved',
    },
  ])

  // eslint-disable-next-line no-console
  console.log('Seed complete')
  process.exit(0)
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
