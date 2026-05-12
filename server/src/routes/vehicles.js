const express = require('express')
const { Op } = require('sequelize')
const { Vehicle } = require('../models')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({ order: [['id', 'ASC']] })
    return res.json({ success: true, data: { vehicles } })
  } catch (error) {
    return next(error)
  }
})

router.get('/search', requireAuth, async (req, res, next) => {
  try {
    const plate = (req.query.plate || '').replace(/\s+/g, '').toUpperCase()
    const vehicles = await Vehicle.findAll({
      where: {
        registration_number: {
          [Op.iLike]: `%${plate.split('').join('%')}%`,
        },
      },
    })
    return res.json({ success: true, data: { vehicles } })
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id)
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' })
    return res.json({ success: true, data: { vehicle } })
  } catch (error) {
    return next(error)
  }
})

router.post('/', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body)
    return res.status(201).json({ success: true, data: { vehicle } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
