const express = require('express')
const { FuelRecord, Trip } = require('../models')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const parsedTripId = req.body.trip_id ? Number(req.body.trip_id) : null
    const parsedVehicleId = req.body.vehicle_id ? Number(req.body.vehicle_id) : null

    let linkedTripId = parsedTripId
    let linkedVehicleId = parsedVehicleId

    const activeTrip = await Trip.findOne({
      where: { driver_id: req.user.id, end_time: null },
      order: [['start_time', 'DESC']],
    })

    if (activeTrip) {
      linkedTripId = activeTrip.id
      linkedVehicleId = activeTrip.vehicle_id
    } else if (parsedTripId) {
      const trip = await Trip.findByPk(parsedTripId)
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' })
      if (trip.driver_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only link your own trips' })
      }
      if (parsedVehicleId && parsedVehicleId !== trip.vehicle_id) {
        return res.status(400).json({ success: false, message: 'vehicle_id must match the selected trip vehicle' })
      }
      linkedVehicleId = trip.vehicle_id
    }

    if (linkedVehicleId === null || !Number.isInteger(linkedVehicleId)) {
      return res.status(400).json({ success: false, message: 'vehicle_id is required' })
    }

    const date = req.body.date
    if (!date) return res.status(400).json({ success: false, message: 'date is required' })
    const litres = req.body.litres === undefined || req.body.litres === '' ? null : Number(req.body.litres)
    const cost = req.body.cost === undefined || req.body.cost === '' ? null : Number(req.body.cost)
    const odometer_reading =
      req.body.odometer_reading === undefined || req.body.odometer_reading === ''
        ? null
        : Number(req.body.odometer_reading)

    if (litres !== null && !Number.isFinite(litres)) {
      return res.status(400).json({ success: false, message: 'litres must be a valid number' })
    }
    if (cost !== null && !Number.isFinite(cost)) {
      return res.status(400).json({ success: false, message: 'cost must be a valid number' })
    }
    if (odometer_reading !== null && !Number.isFinite(odometer_reading)) {
      return res.status(400).json({ success: false, message: 'odometer_reading must be a valid number' })
    }

    const fuelRecord = await FuelRecord.create({
      vehicle_id: linkedVehicleId,
      trip_id: linkedTripId,
      driver_id: req.user.id,
      date,
      litres,
      cost,
      cost_centre: req.body.cost_centre || null,
      receipt_image_url: req.body.receipt_image_url || null,
      odometer_reading,
    })

    return res.status(201).json({ success: true, data: { fuelRecord } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
