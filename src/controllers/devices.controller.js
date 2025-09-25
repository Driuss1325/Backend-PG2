const { genApiKey } = require('../utils/crypto');
const { listDevices, createDevice, updateDevice, rotateDeviceKey, latestReading } = require('../services/device.service');

exports.list = async (_req, res) => {
  const rows = await listDevices();
  res.json(rows);
};

exports.create = async (req, res) => {
  const { device_uid, name, lat, lng, api_key } = req.body || {};
  if (!device_uid || !name) return res.status(400).json({ error: 'device_uid y name requeridos' });
  const key = api_key || genApiKey();
  const dev = await createDevice({ device_uid, name, lat: lat ?? null, lng: lng ?? null, api_key: key });
  res.status(201).json({ ok: true, api_key: key, id: dev.id });
};

exports.patch = async (req, res) => {
  const { id } = req.params;
  const dev = await updateDevice(id, req.body || {});
  if (!dev) return res.status(404).json({ error: 'No encontrado' });
  res.json({ ok: true });
};

exports.rotateKey = async (req, res) => {
  const { id } = req.params;
  const key = genApiKey();
  const dev = await rotateDeviceKey(id, key);
  if (!dev) return res.status(404).json({ error: 'No encontrado' });
  res.json({ ok: true, api_key: key });
};

exports.latest = async (req, res) => {
  const { id } = req.params;
  const row = await latestReading(id);
  if (!row) return res.status(404).json({ error: 'Sin lecturas' });
  res.json(row);
};
