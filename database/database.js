const {Sequelize} = require('sequelize');
const path = require('path')

const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: path.join(__dirname, "dev.sqlite")
  });

module.exports = sequelize;