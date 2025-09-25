const rateLimit = require('express-rate-limit');
const { insertReading, getReadings } = require('../services/reading.service');
const { bumpLastSeen } = require('../services/device.service');

exports.ingestLimiter = rateLimit({ windowMs: 10_000, limit: 100 });

exports.list = async (req, res) => {
  const rows = await getReadings({
    deviceId: req.query.deviceId,
    from: req.query.from,
    to: req.query.to,
    limit: req.query.limit ?? 500
  });
  res.json(rows);
};

exports.ingest = async (req, res) => {
  const device = req.device; // viene del deviceAuth
  const { temperature, humidity, pm2_5, pm10, ts, lat, lng } = req.body || {};
  if ([temperature, humidity, pm2_5, pm10].some(v => typeof v !== 'number')) {
    return res.status(400).json({ error: 'valores numéricos requeridos (temperature, humidity, pm2_5, pm10)' });
  }
  await insertReading({
    device_id: device.id,
    temperature, humidity, pm2_5, pm10,
    lat: lat ?? null, lng: lng ?? null,
    ts: ts ? new Date(ts) : new Date()
  });
  await bumpLastSeen(device.id, lat ?? null, lng ?? null);

  res.status(201).json({ ok: true, issuedApiKey: req.issuedApiKey || null });
};
