const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Booking = sequelize.define(
  'Booking',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicle_id: { type: DataTypes.INTEGER, allowNull: false },
    driver_id: { type: DataTypes.INTEGER, allowNull: false },
    date_from: { type: DataTypes.DATE, allowNull: false },
    date_to: { type: DataTypes.DATE, allowNull: false },
    purpose: DataTypes.STRING(255),
    usage_type: { type: DataTypes.STRING(10), defaultValue: 'business' },
    status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
  },
  { tableName: 'bookings', underscored: true, timestamps: false },
)

module.exports = Booking
