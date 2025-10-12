import {
  Device,
  ApiKey,
  DeviceLocationLog,
  DeviceLog,
} from "../models/index.js";
import { hashKey } from "../utils/hash.js";

export async function listDevices(req, res) {
  const rows = await Device.findAll({ order: [["id", "ASC"]] });
  res.json(rows);
}

export async function createDevice(req, res) {
  const { name, location, ownerId, lat, lng } = req.body;
  const dev = await Device.create({ name, location, ownerId, lat, lng });
  if (lat != null && lng != null) {
    await DeviceLocationLog.create({
      deviceId: dev.id,
      lat,
      lng,
      source: "manual",
    });
  }
  res.status(201).json(dev);
}

export async function updateDeviceLocation(req, res) {
  const { deviceId } = req.params;
  const { lat, lng } = req.body;
  const dev = await Device.findByPk(deviceId);
  if (!dev) return res.status(404).json({ error: "Dispositivo no encontrado" });
  const prev = { lat: dev.lat, lng: dev.lng };
  dev.lat = lat;
  dev.lng = lng;
  await dev.save();
  await DeviceLocationLog.create({
    deviceId: dev.id,
    lat,
    lng,
    source: "manual",
  });
  await DeviceLog.create({
    deviceId: dev.id,
    event: "DEVICE_MOVED",
    details: { prev, next: { lat, lng }, source: "manual" },
  });
  res.json({ ok: true });
}

export async function locationHistory(req, res) {
  const { deviceId } = req.params;
  const rows = await DeviceLocationLog.findAll({
    where: { deviceId },
    order: [["createdAt", "DESC"]],
    limit: 500,
  });
  res.json(rows);
}

export async function enrollDevice(req, res) {
  const { deviceId } = req.body;
  const plain = `fg_${deviceId}_${Math.random().toString(36).slice(2, 10)}`;
  const keyHash = await hashKey(plain);
  const [row, created] = await ApiKey.findOrCreate({
    where: { deviceId },
    defaults: { keyHash, active: true },
  });
  if (!created) {
    row.keyHash = keyHash;
    row.active = true;
    await row.save();
  }
  res.json({ deviceId, apiKey: plain });
}

export async function revokeApiKey(req, res) {
  const { deviceId } = req.params;
  const row = await ApiKey.findOne({ where: { deviceId } });
  if (!row) return res.status(404).json({ error: "ApiKey no encontrada" });
  row.active = false;
  await row.save();
  res.json({ ok: true });
}
