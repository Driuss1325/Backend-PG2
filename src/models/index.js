'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];   // 👈 toma el config con dialect

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const db = {};
fs.readdirSync(__dirname)
  .filter((f) => f !== 'index.js' && f.endsWith('.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((name) => db[name].associate && db[name].associate(db));

db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
