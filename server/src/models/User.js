const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(20), defaultValue: 'driver' },
    phone: DataTypes.STRING(20),
    department: DataTypes.STRING(100),
  },
  { tableName: 'users', underscored: true, timestamps: false },
)

module.exports = User
