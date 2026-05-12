const express = require('express')
const { Trip, Vehicle } = require('../models')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.post('/scan-vehicle', requireAuth, async (req, res, next) => {
  try {
    const plateText = (req.body.plateText || '').replace(/\s+/g, '').toUpperCase()
    if (!plateText) return res.status(400).json({ success: false, message: 'plateText is required' })

    const vehicles = await Vehicle.findAll()
    const best = vehicles.find((vehicle) =>
      vehicle.registration_number.replace(/\s+/g, '').toUpperCase().includes(plateText),
    ) || vehicles.find((vehicle) => plateText.includes(vehicle.registration_number.replace(/\s+/g, '').toUpperCase()))

    if (!best) return res.status(404).json({ success: false, message: 'Vehicle not found for scanned text' })
    return res.json({ success: true, data: { vehicle: best } })
  } catch (error) {
    return next(error)
  }
})

router.post('/start', requireAuth, async (req, res, next) => {
  try {
    const { vehicleId, driverId, odometer_start, destination, purpose, usage_type, booking_id } = req.body
    const vehicle = await Vehicle.findByPk(vehicleId)
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' })
    if (vehicle.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Vehicle is not available' })
    }

    const trip = await Trip.create({
      booking_id,
      vehicle_id: vehicleId,
      driver_id: driverId,
      odometer_start,
      destination,
      purpose,
      usage_type,
    })

    await vehicle.update({ status: 'booked', odometer_current: odometer_start })

    return res.status(201).json({ success: true, data: { trip } })
  } catch (error) {
    return next(error)
  }
})

router.put('/:id/end', requireAuth, async (req, res, next) => {
  try {
    const trip = await Trip.findByPk(req.params.id)
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })

    const { odometer_end, notes } = req.body
    const distance_km = Math.max(0, Number(odometer_end) - Number(trip.odometer_start))

    await trip.update({ odometer_end, notes, end_time: new Date(), distance_km })
    await Vehicle.update(
      { status: 'available', odometer_current: odometer_end },
      { where: { id: trip.vehicle_id } },
    )

    return res.json({ success: true, data: { trip } })
  } catch (error) {
    return next(error)
  }
})

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const where = {}
    if (req.query.driverId) where.driver_id = req.query.driverId
    const trips = await Trip.findAll({ where, order: [['id', 'DESC']] })
    return res.json({ success: true, data: { trips } })
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const trip = await Trip.findByPk(req.params.id, { include: [{ model: Vehicle, as: 'vehicle' }] })
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })
    return res.json({ success: true, data: { trip } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
