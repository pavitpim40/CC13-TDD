const Sequelize = require('sequelize');
const config = require('../../config/config.json');

const dbConnection = config[process.env.NODE_ENV];

const sequelize = new Sequelize(dbConnection);

module.exports = sequelize;
