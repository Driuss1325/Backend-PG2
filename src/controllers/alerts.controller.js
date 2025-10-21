import { Op } from "sequelize";
import { Alert, AlertThreshold } from "../models/index.js";

const DEFAULT_THRESHOLDS = Object.freeze({
  temperature: 60, // max
  humidity: 15,    // min
  pm25: 200,       // max
  pm10: 300,       // max
});

/**
 * GET /api/alerts
 * Query opcional: deviceId, since, until, acknowledged (true|false)
 */
export async function listAlerts(req, res) {
  const { deviceId, since, until, acknowledged } = req.query;

  const where = {};
  if (deviceId) where.deviceId = Number(deviceId);

  if (since || until) {
    where.createdAt = {};
    if (since) where.createdAt[Op.gte] = new Date(since);
    if (until) where.createdAt[Op.lte] = new Date(until);
  }

  if (acknowledged === "true") where.acknowledged = true;
  if (acknowledged === "false") where.acknowledged = { [Op.or]: [false, null] };

  const rows = await Alert.findAll({
    where,
    order: [["id", "DESC"]],
    limit: 200,
  });

  res.json(rows);
}

/** POST /api/alerts/:id/ack */
export async function ackAlert(req, res) {
  const { id } = req.params;
  const a = await Alert.findByPk(id);
  if (!a) return res.status(404).json({ message: "Alert not found" });

  a.acknowledged = true;
  a.acknowledgedAt = new Date();
  await a.save();

  res.json({ ok: true });
}

/**
 * POST /api/alerts/:id/mute
 * Body opcional: { minutes?: number, until?: ISO }
 */
export async function muteAlert(req, res) {
  const { id } = req.params;
  const { minutes, until } = req.body || {};
  const a = await Alert.findByPk(id);
  if (!a) return res.status(404).json({ message: "Alert not found" });

  let mutedUntil;
  if (until) {
    mutedUntil = new Date(until);
  } else {
    const m = Number.isFinite(Number(minutes)) ? Number(minutes) : 60;
    mutedUntil = new Date(Date.now() + m * 60 * 1000);
  }

  a.mutedUntil = mutedUntil;
  await a.save();

  res.json({ ok: true, mutedUntil });
}

/** GET /api/alerts/thresholds?deviceId= */
export async function getThresholds(req, res) {
  const deviceId = req.query.deviceId ? Number(req.query.deviceId) : null;

  if (deviceId) {
    const row = await AlertThreshold.findOne({ where: { deviceId } });
    if (row) return res.json(pick(row));
  }

  const globalRow = await AlertThreshold.findOne({ where: { deviceId: null } });
  if (globalRow) return res.json(pick(globalRow));

  res.json(DEFAULT_THRESHOLDS);
}

/** PUT /api/alerts/thresholds?deviceId= */
export async function putThresholds(req, res) {
  const deviceId = req.query.deviceId ? Number(req.query.deviceId) : null;
  const incoming = sanitize(req.body || {});
  if (!incoming) return res.status(400).json({ message: "Invalid thresholds payload" });

  const [row, created] = await AlertThreshold.findOrCreate({
    where: { deviceId },
    defaults: { deviceId, ...incoming },
  });

  if (!created) {
    Object.assign(row, incoming);
    await row.save();
  }

  res.json({ ok: true });
}

/** (Opcional) GET /api/alerts/thresholds/effective?deviceId= */
export async function getEffectiveThresholds(req, res) {
  const deviceId = req.query.deviceId ? Number(req.query.deviceId) : null;

  try {
    if (deviceId) {
      const d = await AlertThreshold.findOne({ where: { deviceId } });
      if (d) return res.json({ source: "device", ...pick(d) });
    }
    const g = await AlertThreshold.findOne({ where: { deviceId: null } });
    if (g) return res.json({ source: "global", ...pick(g) });
  } catch {
    return res.json({ source: "default", ...DEFAULT_THRESHOLDS });
  }
  return res.json({ source: "default", ...DEFAULT_THRESHOLDS });
}

/** helpers */
function pick(row) {
  return {
    temperature: Number(row.temperature),
    humidity: Number(row.humidity),
    pm25: Number(row.pm25),
    pm10: Number(row.pm10),
  };
}
function sanitize(obj) {
  const t = {
    temperature: toN(obj.temperature, DEFAULT_THRESHOLDS.temperature),
    humidity: toN(obj.humidity, DEFAULT_THRESHOLDS.humidity),
    pm25: toN(obj.pm25, DEFAULT_THRESHOLDS.pm25),
    pm10: toN(obj.pm10, DEFAULT_THRESHOLDS.pm10),
  };
  if ([t.temperature, t.humidity, t.pm25, t.pm10].some((v) => !isFinite(v))) return null;
  return t;
}
function toN(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
