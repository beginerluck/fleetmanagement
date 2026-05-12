const express = require('express')
const fs = require('fs')
const path = require('path')
const { Op } = require('sequelize')
const { FuelRecord, Trip, User, Vehicle } = require('../models')
const { requireAuth, requireRole } = require('../middleware/auth')
const { fuelReceiptUpload } = require('../middleware/upload')

const router = express.Router()

const costCentres = ['Operations', 'Administration', 'Sales', 'Maintenance', 'Executive']
const fuelTypes = ['Unleaded 91', 'Unleaded 95', 'Unleaded 98', 'Diesel', 'LPG', 'Electric (charge)']

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function sanitizeText(value) {
  const normalized = value?.toString().trim()
  return normalized ? normalized : null
}

function formatCostPerLitre(cost, litres) {
  if (!cost || !litres) return null
  return Number((cost / litres).toFixed(3))
}

function buildFuelWhere(query, user) {
  const where = {}

  if (query.vehicleId) where.vehicle_id = query.vehicleId
  if (query.costCentre) where.cost_centre = query.costCentre
  if (query.fuelType) where.fuel_type = query.fuelType

  if (user.role === 'driver') where.driver_id = user.id
  else if (query.driverId) where.driver_id = query.driverId

  if (query.dateFrom || query.dateTo) {
    where.date = {}
    if (query.dateFrom) where.date[Op.gte] = query.dateFrom
    if (query.dateTo) where.date[Op.lte] = query.dateTo
  }

  return where
}

function getPagination(query) {
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  return { page, limit, offset: (page - 1) * limit }
}

function getSort(query) {
  const sortMap = {
    date: ['date', 'DESC'],
    vehicle: [{ model: Vehicle, as: 'vehicle' }, 'registration_number', 'ASC'],
    driver: [{ model: User, as: 'driver' }, 'name', 'ASC'],
    litres: ['litres', 'DESC'],
    cost: ['cost', 'DESC'],
    cost_per_litre: ['cost_per_litre', 'DESC'],
    odometer_reading: ['odometer_reading', 'DESC'],
    cost_centre: ['cost_centre', 'ASC'],
    fuel_type: ['fuel_type', 'ASC'],
    station: ['station', 'ASC'],
  }
  const sortBy = query.sortBy && sortMap[query.sortBy] ? query.sortBy : 'date'
  const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC'

  if (Array.isArray(sortMap[sortBy][0])) return [sortMap[sortBy]]
  if (typeof sortMap[sortBy][0] === 'object') return [[sortMap[sortBy][0], sortMap[sortBy][1], sortOrder]]
  return [[sortMap[sortBy][0], sortOrder]]
}

function serializeFuelRecord(record) {
  const litres = Number(record.litres || 0)
  const cost = Number(record.cost || 0)
  const costPerLitre = Number(record.cost_per_litre || formatCostPerLitre(cost, litres) || 0)

  return {
    id: record.id,
    vehicle_id: record.vehicle_id,
    trip_id: record.trip_id,
    driver_id: record.driver_id,
    date: record.date,
    litres,
    cost,
    cost_centre: record.cost_centre,
    receipt_image_url: record.receipt_image_url,
    odometer_reading: record.odometer_reading,
    fuel_type: record.fuel_type,
    station: record.station,
    notes: record.notes,
    cost_per_litre: costPerLitre,
    vehicle: record.vehicle
      ? {
          id: record.vehicle.id,
          registration_number: record.vehicle.registration_number,
          make: record.vehicle.make,
          model: record.vehicle.model,
        }
      : null,
    driver: record.driver
      ? {
          id: record.driver.id,
          name: record.driver.name,
          role: record.driver.role,
        }
      : null,
    trip: record.trip
      ? {
          id: record.trip.id,
          destination: record.trip.destination,
          start_time: record.trip.start_time,
        }
      : null,
  }
}

async function loadFuelRecords(where, order, pagination) {
  return FuelRecord.findAndCountAll({
    where,
    include: [
      { model: Vehicle, as: 'vehicle', attributes: ['id', 'registration_number', 'make', 'model'] },
      { model: User, as: 'driver', attributes: ['id', 'name', 'role'] },
      { model: Trip, as: 'trip', attributes: ['id', 'destination', 'start_time'] },
    ],
    order,
    limit: pagination?.limit,
    offset: pagination?.offset,
  })
}

async function getFilterOptions() {
  const [vehicles, drivers] = await Promise.all([
    Vehicle.findAll({
      attributes: ['id', 'registration_number', 'make', 'model'],
      order: [['registration_number', 'ASC']],
    }),
    User.findAll({
      where: { role: 'driver' },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    }),
  ])

  return { vehicles, drivers, costCentres, fuelTypes }
}

function buildCsv(records) {
  const headers = [
    'Date',
    'Vehicle',
    'Driver',
    'Litres',
    'Cost AUD',
    'Cost per Litre',
    'Odometer',
    'Cost Centre',
    'Fuel Type',
    'Station',
    'Trip',
    'Notes',
  ]

  const escape = (value) => `"${`${value ?? ''}`.replace(/"/g, '""')}"`

  const rows = records.map((record) =>
    [
      record.date,
      [record.vehicle?.registration_number, record.vehicle?.make, record.vehicle?.model].filter(Boolean).join(' '),
      record.driver?.name,
      record.litres,
      record.cost,
      record.cost_per_litre,
      record.odometer_reading,
      record.cost_centre,
      record.fuel_type,
      record.station,
      record.trip?.destination || '—',
      record.notes,
    ]
      .map(escape)
      .join(','),
  )

  return [headers.join(','), ...rows].join('\n')
}

async function removeReceiptFile(receiptUrl) {
  if (!receiptUrl) return
  const uploadsDirectory = path.join(__dirname, '..', '..', 'uploads', 'fuel-receipts')
  const fileName = path.basename(receiptUrl)
  if (!/^receipt-\d+-[a-z0-9]+\.(jpe?g|png|pdf)$/i.test(fileName)) return
  const filePath = path.resolve(uploadsDirectory, fileName)
  if (!filePath.startsWith(path.resolve(uploadsDirectory) + path.sep)) return
  await fs.promises.unlink(filePath).catch(() => {})
}

router.post('/', requireAuth, fuelReceiptUpload.single('receipt'), async (req, res, next) => {
  try {
    const parsedVehicleId = toNumber(req.body.vehicle_id)
    const parsedTripId = toNumber(req.body.trip_id)
    const parsedDriverId = req.user.role === 'driver' ? req.user.id : toNumber(req.body.driver_id)
    const parsedLitres = toNumber(req.body.litres)
    const parsedCost = toNumber(req.body.cost)
    const parsedOdometer = toNumber(req.body.odometer_reading)
    const date = sanitizeText(req.body.date)
    const costCentre = sanitizeText(req.body.cost_centre)
    const fuelType = sanitizeText(req.body.fuel_type)
    const station = sanitizeText(req.body.station)
    const notes = sanitizeText(req.body.notes)

    if (!req.file) return res.status(400).json({ success: false, message: 'Receipt file is required' })
    if (!parsedVehicleId || !parsedDriverId || !date || !parsedLitres || !parsedCost || !parsedOdometer || !costCentre || !fuelType || !station) {
      return res.status(400).json({ success: false, message: 'All required receipt fields must be provided' })
    }
    if (!costCentres.includes(costCentre)) {
      return res.status(400).json({ success: false, message: 'Invalid cost centre' })
    }
    if (!fuelTypes.includes(fuelType)) {
      return res.status(400).json({ success: false, message: 'Invalid fuel type' })
    }

    const [vehicle, driver, trip] = await Promise.all([
      Vehicle.findByPk(parsedVehicleId),
      User.findByPk(parsedDriverId),
      parsedTripId ? Trip.findByPk(parsedTripId) : null,
    ])

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' })
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' })
    if (parsedTripId && !trip) return res.status(404).json({ success: false, message: 'Trip not found' })
    if (trip && trip.vehicle_id !== parsedVehicleId) {
      return res.status(400).json({ success: false, message: 'Trip does not belong to the selected vehicle' })
    }

    const fuelRecord = await FuelRecord.create({
      vehicle_id: parsedVehicleId,
      trip_id: parsedTripId,
      driver_id: parsedDriverId,
      date,
      litres: parsedLitres,
      cost: parsedCost,
      odometer_reading: parsedOdometer,
      cost_centre: costCentre,
      fuel_type: fuelType,
      station,
      notes,
      cost_per_litre: formatCostPerLitre(parsedCost, parsedLitres),
      receipt_image_url: `/uploads/fuel-receipts/${req.file.filename}`,
    })

    const created = await FuelRecord.findByPk(fuelRecord.id, {
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'registration_number', 'make', 'model'] },
        { model: User, as: 'driver', attributes: ['id', 'name', 'role'] },
        { model: Trip, as: 'trip', attributes: ['id', 'destination', 'start_time'] },
      ],
    })

    return res.status(201).json({ success: true, data: { record: serializeFuelRecord(created) } })
  } catch (error) {
    if (req.file?.filename) await removeReceiptFile(`/uploads/fuel-receipts/${req.file.filename}`)
    return next(error)
  }
})

router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear()
    const month = Math.min(Math.max(Number(req.query.month) || new Date().getMonth() + 1, 1), 12)
    const year = Math.min(Math.max(Number(req.query.year) || currentYear, 2000), currentYear)
    const dateFrom = `${year}-${`${month}`.padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0)
    const dateTo = `${year}-${`${month}`.padStart(2, '0')}-${`${endDate.getDate()}`.padStart(2, '0')}`
    const where = buildFuelWhere({ ...req.query, dateFrom, dateTo }, req.user)

    const records = await FuelRecord.findAll({
      where,
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'registration_number', 'make', 'model'] }],
      order: [['date', 'DESC']],
    })

    const totals = records.reduce(
      (acc, record) => {
        acc.total_cost += Number(record.cost || 0)
        acc.total_litres += Number(record.litres || 0)
        return acc
      },
      { total_cost: 0, total_litres: 0 },
    )

    const group = (keyBuilder) =>
      Object.values(
        records.reduce((acc, record) => {
          const key = keyBuilder(record)
          if (!acc[key]) acc[key] = { label: key, total_cost: 0, total_litres: 0, record_count: 0 }
          acc[key].total_cost += Number(record.cost || 0)
          acc[key].total_litres += Number(record.litres || 0)
          acc[key].record_count += 1
          return acc
        }, {}),
      )

    const avgCostPerLitre = totals.total_litres ? Number((totals.total_cost / totals.total_litres).toFixed(3)) : 0

    return res.json({
      success: true,
      data: {
        total_cost: Number(totals.total_cost.toFixed(2)),
        total_litres: Number(totals.total_litres.toFixed(2)),
        avg_cost_per_litre: avgCostPerLitre,
        record_count: records.length,
        grouped_by_vehicle: group(
          (record) =>
            [record.vehicle?.registration_number, record.vehicle?.make, record.vehicle?.model].filter(Boolean).join(' ') || 'Unknown',
        ),
        grouped_by_cost_centre: group((record) => record.cost_centre || 'Unknown'),
        grouped_by_fuel_type: group((record) => record.fuel_type || 'Unknown'),
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/export', requireAuth, async (req, res, next) => {
  try {
    const where = buildFuelWhere(req.query, req.user)
    const records = await FuelRecord.findAll({
      where,
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'registration_number', 'make', 'model'] },
        { model: User, as: 'driver', attributes: ['id', 'name', 'role'] },
        { model: Trip, as: 'trip', attributes: ['id', 'destination', 'start_time'] },
      ],
      order: getSort(req.query),
    })

    const csv = buildCsv(records.map(serializeFuelRecord))
    const today = new Date().toISOString().slice(0, 10)
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="fuel-records-${today}.csv"`)
    return res.send(csv)
  } catch (error) {
    return next(error)
  }
})

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pagination = getPagination(req.query)
    const where = buildFuelWhere(req.query, req.user)
    const order = getSort(req.query)
    const [{ count, rows }, filters] = await Promise.all([loadFuelRecords(where, order, pagination), getFilterOptions()])

    return res.json({
      success: true,
      data: {
        records: rows.map(serializeFuelRecord),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count,
          totalPages: Math.max(Math.ceil(count / pagination.limit), 1),
        },
        filters,
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const record = await FuelRecord.findByPk(req.params.id, {
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'registration_number', 'make', 'model'] },
        { model: User, as: 'driver', attributes: ['id', 'name', 'role'] },
        { model: Trip, as: 'trip', attributes: ['id', 'destination', 'start_time'] },
      ],
    })
    if (!record) return res.status(404).json({ success: false, message: 'Fuel record not found' })
    if (req.user.role === 'driver' && record.driver_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    return res.json({ success: true, data: { record: serializeFuelRecord(record) } })
  } catch (error) {
    return next(error)
  }
})

router.put('/:id', requireAuth, requireRole(['manager', 'admin']), async (req, res, next) => {
  try {
    const record = await FuelRecord.findByPk(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Fuel record not found' })

    const parsedVehicleId = toNumber(req.body.vehicle_id)
    const parsedTripId = toNumber(req.body.trip_id)
    const parsedDriverId = toNumber(req.body.driver_id)
    const parsedLitres = toNumber(req.body.litres)
    const parsedCost = toNumber(req.body.cost)
    const parsedOdometer = toNumber(req.body.odometer_reading)

    const updates = {
      vehicle_id: parsedVehicleId || record.vehicle_id,
      trip_id: req.body.trip_id === undefined ? record.trip_id : parsedTripId,
      driver_id: parsedDriverId || record.driver_id,
      date: sanitizeText(req.body.date) || record.date,
      litres: parsedLitres ?? Number(record.litres),
      cost: parsedCost ?? Number(record.cost),
      odometer_reading: parsedOdometer ?? record.odometer_reading,
      cost_centre: sanitizeText(req.body.cost_centre) || record.cost_centre,
      fuel_type: sanitizeText(req.body.fuel_type) || record.fuel_type,
      station: sanitizeText(req.body.station) || record.station,
      notes: req.body.notes !== undefined ? sanitizeText(req.body.notes) : record.notes,
    }

    if (!costCentres.includes(updates.cost_centre)) {
      return res.status(400).json({ success: false, message: 'Invalid cost centre' })
    }
    if (!fuelTypes.includes(updates.fuel_type)) {
      return res.status(400).json({ success: false, message: 'Invalid fuel type' })
    }

    updates.cost_per_litre = formatCostPerLitre(updates.cost, updates.litres)

    await record.update(updates)

    const refreshed = await FuelRecord.findByPk(record.id, {
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'registration_number', 'make', 'model'] },
        { model: User, as: 'driver', attributes: ['id', 'name', 'role'] },
        { model: Trip, as: 'trip', attributes: ['id', 'destination', 'start_time'] },
      ],
    })

    return res.json({ success: true, data: { record: serializeFuelRecord(refreshed) } })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id', requireAuth, requireRole(['manager', 'admin']), async (req, res, next) => {
  try {
    const record = await FuelRecord.findByPk(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Fuel record not found' })
    const receiptUrl = record.receipt_image_url
    await record.destroy()
    await removeReceiptFile(receiptUrl)
    return res.json({ success: true, data: { deleted: true } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
