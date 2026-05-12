const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const FuelRecord = sequelize.define(
  'FuelRecord',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicle_id: DataTypes.INTEGER,
    trip_id: DataTypes.INTEGER,
    driver_id: DataTypes.INTEGER,
    date: { type: DataTypes.DATEONLY, allowNull: false },
    litres: DataTypes.DECIMAL(8, 2),
    cost: DataTypes.DECIMAL(10, 2),
    cost_centre: DataTypes.STRING(100),
    receipt_image_url: DataTypes.STRING(500),
    odometer_reading: DataTypes.INTEGER,
  },
  { tableName: 'fuel_records', underscored: true, timestamps: false },
)

module.exports = FuelRecord
