import {
  Reading,
  DeviceLog,
  Device,
  DeviceLocationLog,
} from "../models/index.js";
import { evaluateAndCreateAlerts } from "../services/alert.service.js";
import { emitReading, emitAlert } from "../services/socket.service.js";
import { Op } from 'sequelize';

export async function ingestReading(req, res) {
  const { temperature, humidity, pm25, pm10, lat, lng, accuracy } = req.body;
  const deviceId = req.device.id;

  const reading = await Reading.create({
    deviceId,
    temperature,
    humidity,
    pm25,
    pm10,
  });
  emitReading({
    deviceId,
    temperature,
    humidity,
    pm25,
    pm10,
    createdAt: reading.createdAt,
    lat,
    lng,
  });

  if (lat != null && lng != null) {
    const device = await Device.findByPk(deviceId);
    const moved =
      !device.lat ||
      !device.lng ||
      Number(device.lat) !== Number(lat) ||
      Number(device.lng) !== Number(lng);
    if (moved) {
      const prev = { lat: device.lat, lng: device.lng };
      device.lat = lat;
      device.lng = lng;
      await device.save();
      await DeviceLocationLog.create({
        deviceId,
        lat,
        lng,
        source: "agent",
        accuracy,
      });
      await DeviceLog.create({
        deviceId,
        event: "DEVICE_MOVED",
        details: { prev, next: { lat, lng }, accuracy },
      });
    }
  }

  const alerts = await evaluateAndCreateAlerts(deviceId, {
    temperature,
    humidity,
    pm25,
    pm10,
  });
  for (const a of alerts) emitAlert(a);

  await DeviceLog.create({
    deviceId,
    event: "READING_INGESTED",
    details: { temperature, humidity, pm25, pm10 },
  });
  res.status(201).json({ ok: true });
}

export async function getReadings(req, res, next) {
  try {
    const deviceId = req.query.deviceId ?? req.query.device_id;
    const limitRaw = Number(req.query.limit ?? 100);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 5000) : 100;
    const order = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const since = req.query.since ? new Date(req.query.since) : null;
    const to    = req.query.to    ? new Date(req.query.to)    : null;

    const where = {};
    if (deviceId != null && deviceId !== '') where.deviceId = Number(deviceId);

    if (since || to) {
      where.createdAt = {};
      if (since && !isNaN(since)) where.createdAt[Op.gte] = since;
      if (to && !isNaN(to))       where.createdAt[Op.lte] = to;
    }

    const rows = await Reading.findAll({
      where,
      order: [['createdAt', order]],
      limit,
      attributes: ['id','deviceId','temperature','humidity','pm25','pm10','createdAt'],
    });

    res.json({ data: rows });
  } catch (err) {
    next?.(err) ?? res.status(500).json({ error: 'Internal error' });
  }
}
