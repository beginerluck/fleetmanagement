const { Sequelize } = require('sequelize')

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/fleettrack'

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
})

module.exports = sequelize
