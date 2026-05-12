const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const FuelRecord = sequelize.define(
  'FuelRecord',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicle_id: { type: DataTypes.INTEGER, allowNull: false },
    trip_id: DataTypes.INTEGER,
    driver_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    litres: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    cost: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    cost_centre: { type: DataTypes.STRING(100), allowNull: false },
    receipt_image_url: { type: DataTypes.STRING(500), allowNull: false },
    odometer_reading: { type: DataTypes.INTEGER, allowNull: false },
    fuel_type: DataTypes.STRING(30),
    station: DataTypes.STRING(100),
    notes: DataTypes.TEXT,
    cost_per_litre: DataTypes.DECIMAL(6, 3),
  },
  { tableName: 'fuel_records', underscored: true, timestamps: false },
)

module.exports = FuelRecord
