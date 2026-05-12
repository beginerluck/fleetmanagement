const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Trip = sequelize.define(
  'Trip',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    booking_id: DataTypes.INTEGER,
    vehicle_id: { type: DataTypes.INTEGER, allowNull: false },
    driver_id: { type: DataTypes.INTEGER, allowNull: false },
    odometer_start: { type: DataTypes.INTEGER, allowNull: false },
    odometer_end: DataTypes.INTEGER,
    destination: DataTypes.STRING(255),
    purpose: DataTypes.STRING(255),
    usage_type: { type: DataTypes.STRING(10), defaultValue: 'business' },
    start_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    end_time: DataTypes.DATE,
    distance_km: DataTypes.INTEGER,
    notes: DataTypes.TEXT,
  },
  { tableName: 'trips', underscored: true, timestamps: false },
)

module.exports = Trip
