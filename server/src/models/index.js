const User = require('./User')
const Vehicle = require('./Vehicle')
const Booking = require('./Booking')
const Trip = require('./Trip')
const FuelRecord = require('./FuelRecord')
const Compliance = require('./Compliance')

Vehicle.hasMany(Booking, { foreignKey: 'vehicle_id' })
Booking.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' })
User.hasMany(Booking, { foreignKey: 'driver_id' })
Booking.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' })

Vehicle.hasMany(Trip, { foreignKey: 'vehicle_id' })
Trip.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' })
User.hasMany(Trip, { foreignKey: 'driver_id' })
Trip.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' })

module.exports = { User, Vehicle, Booking, Trip, FuelRecord, Compliance }
