// npm i objection knex pg

const { Model } = require('objection')
const connection = require('./knexfile')
const Knex = require('knex')

const knexConnection = Knex(connection)

// Give the knex instance to objection
Model.knex(knexConnection)

module.exports = knexConnection