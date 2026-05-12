const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Compliance = sequelize.define(
  'Compliance',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicle_id: DataTypes.INTEGER,
    type: { type: DataTypes.STRING(30), allowNull: false },
    due_date: DataTypes.DATEONLY,
    due_km: DataTypes.INTEGER,
    last_done_date: DataTypes.DATEONLY,
    last_done_km: DataTypes.INTEGER,
    document_url: DataTypes.STRING(500),
    alert_60_sent: { type: DataTypes.BOOLEAN, defaultValue: false },
    alert_30_sent: { type: DataTypes.BOOLEAN, defaultValue: false },
    alert_7_sent: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: { type: DataTypes.STRING(20), defaultValue: 'ok' },
  },
  { tableName: 'compliance', underscored: true, timestamps: false },
)

module.exports = Compliance
