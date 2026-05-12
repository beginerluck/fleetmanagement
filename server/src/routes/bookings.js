const express = require('express')
const { Op } = require('sequelize')
const { Booking, Vehicle, User } = require('../models')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

function parseDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.valueOf()) ? null : parsed
}

function canManage(user) {
  return user && (user.role === 'manager' || user.role === 'admin')
}

async function findOverlappingBooking({ vehicleId, dateFrom, dateTo, excludeId }) {
  return Booking.findOne({
    where: {
      vehicle_id: vehicleId,
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      status: { [Op.notIn]: ['cancelled'] },
      [Op.and]: [{ date_from: { [Op.lt]: dateTo } }, { date_to: { [Op.gt]: dateFrom } }],
    },
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: User, as: 'driver', attributes: ['id', 'name', 'email'] },
    ],
    order: [['date_from', 'ASC']],
  })
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const {
      date,
      dateFrom,
      dateTo,
      vehicleId,
      driverId,
      status,
      usageType,
    } = req.query

    const where = {}

    if (date) {
      const startOfDay = parseDate(`${date}T00:00:00`)
      const endOfDay = parseDate(`${date}T23:59:59`)
      if (startOfDay && endOfDay) {
        where.date_from = { [Op.lte]: endOfDay }
        where.date_to = { [Op.gte]: startOfDay }
      }
    } else if (dateFrom || dateTo) {
      const from = parseDate(dateFrom)
      const to = parseDate(dateTo)
      if (from && to) {
        where[Op.and] = [{ date_from: { [Op.lt]: to } }, { date_to: { [Op.gt]: from } }]
      } else if (from) {
        where.date_to = { [Op.gte]: from }
      } else if (to) {
        where.date_from = { [Op.lte]: to }
      }
    }

    if (vehicleId) {
      const ids = String(vehicleId)
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)
      if (ids.length === 1) where.vehicle_id = ids[0]
      if (ids.length > 1) where.vehicle_id = { [Op.in]: ids }
    }

    if (driverId) {
      const parsedDriverId = Number(driverId)
      if (Number.isInteger(parsedDriverId)) where.driver_id = parsedDriverId
    }

    if (status && status !== 'all') {
      const statuses = String(status)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      if (statuses.length === 1) where.status = statuses[0]
      if (statuses.length > 1) where.status = { [Op.in]: statuses }
    }

    if (usageType && usageType !== 'all') {
      where.usage_type = String(usageType).toLowerCase()
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'driver', attributes: ['id', 'name', 'email', 'department'] },
      ],
      order: [['date_from', 'ASC']],
    })

    return res.json({ success: true, data: { bookings } })
  } catch (error) {
    return next(error)
  }
})

router.get('/drivers', requireAuth, async (req, res, next) => {
  try {
    const drivers = await User.findAll({
      where: { role: 'driver' },
      attributes: ['id', 'name', 'email', 'department'],
      order: [['name', 'ASC']],
    })
    return res.json({ success: true, data: { drivers } })
  } catch (error) {
    return next(error)
  }
})

router.get('/availability', requireAuth, async (req, res, next) => {
  try {
    const dateFrom = parseDate(req.query.date_from)
    const dateTo = parseDate(req.query.date_to)

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ success: false, message: 'date_from and date_to are required' })
    }

    if (dateTo <= dateFrom) {
      return res.status(400).json({ success: false, message: 'date_to must be after date_from' })
    }

    const [vehicles, overlappingBookings] = await Promise.all([
      Vehicle.findAll({ order: [['registration_number', 'ASC']] }),
      Booking.findAll({
        where: {
          status: { [Op.notIn]: ['cancelled'] },
          [Op.and]: [{ date_from: { [Op.lt]: dateTo } }, { date_to: { [Op.gt]: dateFrom } }],
        },
        include: [{ model: User, as: 'driver', attributes: ['id', 'name'] }],
      }),
    ])

    const firstConflictByVehicle = new Map()
    for (const booking of overlappingBookings) {
      if (!firstConflictByVehicle.has(booking.vehicle_id)) {
        firstConflictByVehicle.set(booking.vehicle_id, booking)
      }
    }

    const availability = vehicles.map((vehicle) => {
      const conflictingBooking = firstConflictByVehicle.get(vehicle.id)
      const inService = vehicle.status === 'service'

      return {
        ...vehicle.toJSON(),
        available: !inService && !conflictingBooking,
        conflictingBooking: conflictingBooking
          ? {
              id: conflictingBooking.id,
              driver: conflictingBooking.driver,
              time: {
                from: conflictingBooking.date_from,
                to: conflictingBooking.date_to,
              },
            }
          : null,
        unavailableReason: inService ? 'service' : conflictingBooking ? 'booked' : null,
      }
    })

    return res.json({ success: true, data: { vehicles: availability } })
  } catch (error) {
    return next(error)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { vehicle_id, driver_id, date_from, date_to, purpose, usage_type, cost_centre } = req.body
    const parsedVehicleId = Number(vehicle_id)
    const parsedDriverId = Number(driver_id)
    const parsedDateFrom = parseDate(date_from)
    const parsedDateTo = parseDate(date_to)

    if (!parsedDateFrom || !parsedDateTo || !Number.isInteger(parsedVehicleId) || !Number.isInteger(parsedDriverId)) {
      return res.status(400).json({ success: false, message: 'vehicle_id, driver_id, date_from and date_to are required' })
    }

    if (parsedDateTo <= parsedDateFrom) {
      return res.status(400).json({ success: false, message: 'date_to must be after date_from' })
    }

    if (!canManage(req.user) && req.user.id !== parsedDriverId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const overlappingBooking = await findOverlappingBooking({
      vehicleId: parsedVehicleId,
      dateFrom: parsedDateFrom,
      dateTo: parsedDateTo,
    })

    if (overlappingBooking) {
      return res.status(409).json({ success: false, message: 'Vehicle already booked for this time' })
    }

    const booking = await Booking.create({
      vehicle_id: parsedVehicleId,
      driver_id: parsedDriverId,
      date_from: parsedDateFrom,
      date_to: parsedDateTo,
      purpose: purpose?.toString().trim() || null,
      usage_type: usage_type || 'business',
      cost_centre: cost_centre?.toString().trim() || null,
      status: 'pending',
    })

    const fullBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'driver', attributes: ['id', 'name', 'email', 'department'] },
      ],
    })

    return res.status(201).json({ success: true, data: { booking: fullBooking } })
  } catch (error) {
    return next(error)
  }
})

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (!canManage(req.user) && req.user.id !== booking.driver_id) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const nextVehicleId = req.body.vehicle_id ? Number(req.body.vehicle_id) : booking.vehicle_id
    const nextDriverId = req.body.driver_id ? Number(req.body.driver_id) : booking.driver_id
    const nextDateFrom = req.body.date_from ? parseDate(req.body.date_from) : new Date(booking.date_from)
    const nextDateTo = req.body.date_to ? parseDate(req.body.date_to) : new Date(booking.date_to)

    if (!nextDateFrom || !nextDateTo || !Number.isInteger(nextVehicleId) || !Number.isInteger(nextDriverId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking payload' })
    }

    if (nextDateTo <= nextDateFrom) {
      return res.status(400).json({ success: false, message: 'date_to must be after date_from' })
    }

    if (!canManage(req.user) && req.user.id !== nextDriverId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const overlappingBooking = await findOverlappingBooking({
      vehicleId: nextVehicleId,
      dateFrom: nextDateFrom,
      dateTo: nextDateTo,
      excludeId: booking.id,
    })

    if (overlappingBooking) {
      return res.status(409).json({ success: false, message: 'Vehicle already booked for this time' })
    }

    booking.vehicle_id = nextVehicleId
    booking.driver_id = nextDriverId
    booking.date_from = nextDateFrom
    booking.date_to = nextDateTo
    if (req.body.purpose !== undefined) booking.purpose = req.body.purpose?.toString().trim() || null
    if (req.body.usage_type !== undefined) booking.usage_type = req.body.usage_type || 'business'
    if (req.body.cost_centre !== undefined) booking.cost_centre = req.body.cost_centre?.toString().trim() || null
    if (canManage(req.user) && req.body.status) booking.status = req.body.status
    await booking.save()

    const fullBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'driver', attributes: ['id', 'name', 'email', 'department'] },
      ],
    })

    return res.json({ success: true, data: { booking: fullBooking } })
  } catch (error) {
    return next(error)
  }
})

router.put('/:id/approve', requireAuth, requireRole(['manager', 'admin']), async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    booking.status = 'approved'
    await booking.save()

    return res.json({ success: true, data: { booking } })
  } catch (error) {
    return next(error)
  }
})

router.put('/:id/reject', requireAuth, requireRole(['manager', 'admin']), async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    booking.status = 'cancelled'
    await booking.save()

    return res.json({ success: true, data: { booking } })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (!canManage(req.user) && req.user.id !== booking.driver_id) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    booking.status = 'cancelled'
    await booking.save()

    return res.json({ success: true, data: { booking } })
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'driver', attributes: ['id', 'name', 'email', 'department'] },
      ],
    })
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (!canManage(req.user) && req.user.id !== booking.driver_id) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    return res.json({ success: true, data: { booking } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
