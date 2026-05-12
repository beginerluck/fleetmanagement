const express = require('express')
const { Op } = require('sequelize')
const { Booking, Trip, Vehicle } = require('../models')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

router.get('/active-context', requireAuth, requireRole(['driver']), async (req, res, next) => {
  try {
    const activeTrip = await Trip.findOne({
      where: {
        driver_id: req.user.id,
        end_time: {
          [Op.is]: null,
        },
      },
      include: [{ model: Vehicle, as: 'vehicle' }],
      order: [['start_time', 'DESC']],
    })

    const upcomingBooking = await Booking.findOne({
      where: {
        driver_id: req.user.id,
        date_from: {
          [Op.gte]: new Date(),
        },
      },
      include: [{ model: Vehicle, as: 'vehicle' }],
      order: [['date_from', 'ASC']],
    })

    return res.json({
      success: true,
      data: {
        activeTrip,
        upcomingBooking,
      },
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
