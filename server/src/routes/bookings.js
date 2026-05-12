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
      where.date_from = { [Op.gte]: new Date(`${date}T00:00:00`) }
      where.date_to = { [Op.lte]: new Date(`${date}T23:59:59`) }
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
    const booking = await Booking.create(req.body)
    return res.status(201).json({ success: true, data: { booking } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
