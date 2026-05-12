const express = require('express')
const { Op } = require('sequelize')
const { Booking, Vehicle } = require('../models')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { date } = req.query
    const where = {}
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00`)
      const endOfDay = new Date(`${date}T23:59:59`)
      where.date_from = { [Op.lte]: endOfDay }
      where.date_to = { [Op.gte]: startOfDay }
    }
    const bookings = await Booking.findAll({
      where,
      include: [{ model: Vehicle, as: 'vehicle' }],
      order: [['date_from', 'ASC']],
    })
    return res.json({ success: true, data: { bookings } })
  } catch (error) {
    return next(error)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { vehicle_id, driver_id, date_from, date_to, purpose, usage_type } = req.body
    const parsedVehicleId = Number(vehicle_id)
    const parsedDriverId = Number(driver_id)
    if (!date_from || !date_to) {
      return res.status(400).json({ success: false, message: 'vehicle_id, driver_id, date_from and date_to are required' })
    }
    if (!Number.isInteger(parsedVehicleId) || !Number.isInteger(parsedDriverId)) {
      return res.status(400).json({ success: false, message: 'vehicle_id and driver_id must be valid integers' })
    }
    if (new Date(date_to) <= new Date(date_from)) {
      return res.status(400).json({ success: false, message: 'date_to must be after date_from' })
    }
    const booking = await Booking.create({
      vehicle_id: parsedVehicleId,
      driver_id: parsedDriverId,
      date_from,
      date_to,
      purpose: purpose || null,
      usage_type: usage_type || 'business',
    })
    return res.status(201).json({ success: true, data: { booking } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
