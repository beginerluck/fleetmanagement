const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Vehicle = sequelize.define(
  'Vehicle',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    registration_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    make: DataTypes.STRING(50),
    model: DataTypes.STRING(50),
    year: DataTypes.INTEGER,
    status: { type: DataTypes.STRING(20), defaultValue: 'available' },
    odometer_current: { type: DataTypes.INTEGER, defaultValue: 0 },
    cost_centre: DataTypes.STRING(100),
  },
  { tableName: 'vehicles', underscored: true, timestamps: false },
)

module.exports = Vehicle
