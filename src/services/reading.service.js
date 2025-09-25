const { Reading } = require('../models');

exports.insertReading = async ({ device_id, temperature, humidity, pm2_5, pm10, lat=null, lng=null, ts=new Date() }) => {
  return Reading.create({ device_id, temperature, humidity, pm2_5, pm10, lat, lng, ts });
};

exports.getReadings = async ({ deviceId, from, to, limit=500 }) => {
  const where = {};
  if (deviceId) where.device_id = Number(deviceId);
  if (from) where.ts = { ...where.ts, gte: new Date(from) };
  if (to) where.ts = { ...where.ts, lte: new Date(to) };

  // Sequelize v6: usar Op
  const { Op } = require('sequelize');
  const ops = {};
  if (from) ops[Op.gte] = new Date(from);
  if (to) ops[Op.lte] = new Date(to);
  if (Object.keys(ops).length) where.ts = ops;

  return Reading.findAll({ where, order: [['ts','DESC']], limit: Number(limit) });
};
