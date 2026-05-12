const express = require('express')
const { Op } = require('sequelize')
const { Trip, Vehicle } = require('../models')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.post('/scan-vehicle', requireAuth, async (req, res, next) => {
  try {
    const plateText = (req.body.plateText || '').replace(/\s+/g, '').toUpperCase()
    if (!plateText) return res.status(400).json({ success: false, message: 'plateText is required' })

    const searchPattern = `%${plateText.split('').join('%')}%`
    const best = await Vehicle.findOne({
      where: {
        registration_number: {
          [Op.iLike]: searchPattern,
        },
      },
      order: [['id', 'ASC']],
    })

    if (!best) return res.status(404).json({ success: false, message: 'Vehicle not found for scanned text' })
    return res.json({ success: true, data: { vehicle: best } })
  } catch (error) {
    return next(error)
  }
})

router.post('/start', requireAuth, async (req, res, next) => {
  try {
    const { vehicleId, driverId, odometer_start, destination, purpose, usage_type, booking_id } = req.body
    const parsedVehicleId = Number(vehicleId)
    const parsedDriverId = Number(driverId)
    const parsedOdometerStart = Number(odometer_start)
    if (!Number.isInteger(parsedVehicleId) || !Number.isInteger(parsedDriverId) || !Number.isFinite(parsedOdometerStart)) {
      return res.status(400).json({
        success: false,
        message: 'vehicleId and driverId must be valid integers, and odometer_start must be a valid number',
      })
    }

    const vehicle = await Vehicle.findByPk(parsedVehicleId)
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' })
    if (vehicle.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Vehicle is not available' })
    }

    const trip = await Trip.create({
      booking_id,
      vehicle_id: parsedVehicleId,
      driver_id: parsedDriverId,
      odometer_start: parsedOdometerStart,
      destination,
      purpose,
      usage_type,
    })

    await vehicle.update({ status: 'booked', odometer_current: parsedOdometerStart })

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
    const parsedOdometerEnd = Number(odometer_end)
    if (!Number.isFinite(parsedOdometerEnd)) {
      return res.status(400).json({ success: false, message: 'odometer_end is required' })
    }
    if (parsedOdometerEnd < Number(trip.odometer_start)) {
      return res.status(400).json({ success: false, message: 'odometer_end must be >= odometer_start' })
    }
    const distance_km = parsedOdometerEnd - Number(trip.odometer_start)

    await trip.update({ odometer_end: parsedOdometerEnd, notes, end_time: new Date(), distance_km })
    await Vehicle.update(
      { status: 'available', odometer_current: parsedOdometerEnd },
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
