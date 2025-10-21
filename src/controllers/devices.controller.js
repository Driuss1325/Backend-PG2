import {
  Device,
  ApiKey,
  DeviceLocationLog,
  DeviceLog,
} from "../models/index.js";
import { sequelize } from "../config/db.js";
import { hashKey } from "../utils/hash.js";

/** ---- helpers ---- */
function toBool(v) {
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

/** Util: último DeviceLocationLog por deviceId */
async function fetchLastLocationsMap() {
  const [rows] = await sequelize.query(`
    SELECT d.deviceId, d.lat, d.lng, d.accuracy, d.source, d.createdAt
    FROM DeviceLocationLogs d
    JOIN (
      SELECT deviceId, MAX(createdAt) AS m
      FROM DeviceLocationLogs
      GROUP BY deviceId
    ) x ON x.deviceId = d.deviceId AND x.m = d.createdAt
  `);

  const map = new Map();
  for (const r of rows) {
    const lat = Number(r.lat);
    const lng = Number(r.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.set(r.deviceId, {
        lat,
        lng,
        accuracy: r.accuracy ?? null,
        source: r.source || "agent",
        createdAt: r.createdAt,
      });
    }
  }
  return map;
}

/** GET /api/devices
 *  Query opcional: ?onlyActive=1|true  -> devuelve solo status='active'
 */
export async function listDevices(req, res) {
  const onlyActive = toBool(req.query.onlyActive);

  const where = {};
  if (onlyActive) where.status = "active";

  const rows = await Device.findAll({
    where,
    order: [["id", "ASC"]],
    raw: true,
  });

  const lastMap = await fetchLastLocationsMap();

  const data = rows.map((d) => {
    const last = lastMap.get(d.id);
    let lastLocation = null;

    if (last) {
      lastLocation = last;
    } else {
      const lat = Number(d.lat);
      const lng = Number(d.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        lastLocation = {
          lat,
          lng,
          accuracy: null,
          source: "device",
          createdAt: d.updatedAt,
        };
      }
    }

    return {
      ...d,
      lat: d.lat != null ? Number(d.lat) : null,
      lng: d.lng != null ? Number(d.lng) : null,
      lastLocation,
    };
  });

  res.json(data);
}

/** POST /api/devices */
export async function createDevice(req, res) {
  const { name, location, ownerId, lat, lng } = req.body || {};
  if (!name) return res.status(400).json({ message: "name is required" });

  const latNum =
    lat !== undefined && lat !== null
      ? Number(lat)
      : location?.lat != null
      ? Number(location.lat)
      : null;
  const lngNum =
    lng !== undefined && lng !== null
      ? Number(lng)
      : location?.lng != null
      ? Number(location.lng)
      : null;

  const dev = await Device.create({
    name,
    ownerId: ownerId ?? null,
    lat: Number.isFinite(latNum) ? latNum : null,
    lng: Number.isFinite(lngNum) ? lngNum : null,
    status: "active",
  });

  if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
    await DeviceLocationLog.create({
      deviceId: dev.id,
      lat: latNum,
      lng: lngNum,
      source: "manual",
    });
  }

  res.status(201).json(dev);
}

/** PUT /api/devices/:deviceId */
export async function updateDevice(req, res) {
  const { deviceId } = req.params;
  const { name, ownerId, lat, lng } = req.body || {};

  const dev = await Device.findByPk(deviceId);
  if (!dev) return res.status(404).json({ message: "Dispositivo no encontrado" });

  const next = {};
  if (typeof name === "string") next.name = name;
  if (ownerId !== undefined) next.ownerId = ownerId;

  const latNum = lat !== undefined ? Number(lat) : undefined;
  const lngNum = lng !== undefined ? Number(lng) : undefined;

  const had = Number.isFinite(Number(dev.lat)) && Number.isFinite(Number(dev.lng));
  const hasNext = Number.isFinite(latNum) && Number.isFinite(lngNum);

  let moved = false;
  const prevLat = Number(dev.lat);
  const prevLng = Number(dev.lng);

  if (hasNext) {
    moved = !had || prevLat !== latNum || prevLng !== lngNum;
    next.lat = latNum;
    next.lng = lngNum;
  }

  await dev.update(next);

  if (moved) {
    await DeviceLocationLog.create({
      deviceId: dev.id,
      lat: latNum,
      lng: lngNum,
      source: "manual",
    });
    await DeviceLog.create({
      deviceId: dev.id,
      event: "DEVICE_MOVED",
      details: {
        prev: { lat: prevLat, lng: prevLng },
        next: { lat: latNum, lng: lngNum },
        source: "manual",
      },
    });
  }

  res.json({ ok: true });
}

/** PUT /api/devices/:deviceId/location (solo ubicación) */
export async function updateDeviceLocation(req, res) {
  const { deviceId } = req.params;
  const latNum = Number(req.body?.lat);
  const lngNum = Number(req.body?.lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return res.status(400).json({ error: "lat/lng inválidos" });
  }

  const dev = await Device.findByPk(deviceId);
  if (!dev) return res.status(404).json({ error: "Dispositivo no encontrado" });

  const prev = { lat: dev.lat, lng: dev.lng };

  dev.lat = latNum;
  dev.lng = lngNum;
  await dev.save();

  await DeviceLocationLog.create({
    deviceId: dev.id,
    lat: latNum,
    lng: lngNum,
    source: "manual",
  });

  await DeviceLog.create({
    deviceId: dev.id,
    event: "DEVICE_MOVED",
    details: { prev, next: { lat: latNum, lng: lngNum }, source: "manual" },
  });

  res.json({ ok: true });
}

/** GET /api/devices/:deviceId/location/history */
export async function locationHistory(req, res) {
  const { deviceId } = req.params;
  const limit = Math.max(1, Math.min(Number(req.query?.limit ?? 500), 1000));

  const rows = await DeviceLocationLog.findAll({
    where: { deviceId },
    order: [["createdAt", "DESC"]],
    limit,
    attributes: ["deviceId", "lat", "lng", "accuracy", "source", "createdAt"],
  });

  res.json(rows);
}

/** POST /api/devices/enroll */
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

/** POST /api/devices/:deviceId/revoke */
export async function revokeApiKey(req, res) {
  const { deviceId } = req.params;
  const row = await ApiKey.findOne({ where: { deviceId } });
  if (!row) return res.status(404).json({ error: "ApiKey no encontrada" });
  row.active = false;
  await row.save();
  res.json({ ok: true });
}

/**
 * Cambiar estado del dispositivo (active|inactive)
 * Acepta deviceId por params (/:deviceId/status) o en el body (/status)
 */
export async function updateDeviceStatus(req, res) {
  const deviceIdParam = req.params?.deviceId;
  const deviceIdBody = req.body?.deviceId;
  const deviceId = deviceIdParam ?? deviceIdBody;

  if (!deviceId) {
    return res.status(400).json({ message: "deviceId is required (path or body)" });
  }

  const status = String(req.body?.status || '').toLowerCase();
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: "status must be 'active' or 'inactive'" });
  }

  const dev = await Device.findByPk(deviceId);
  if (!dev) return res.status(404).json({ message: "Dispositivo no encontrado" });

  const prev = dev.status;
  dev.status = status;
  await dev.save();

  await DeviceLog.create({
    deviceId: dev.id,
    event: "DEVICE_STATUS_CHANGED",
    details: { prev, next: status },
  });

  res.json({ ok: true, status });
}
