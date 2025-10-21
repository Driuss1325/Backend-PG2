import { Op } from "sequelize";
import { Alert, AlertThreshold } from "../models/index.js";

const DEFAULT_THRESHOLDS = Object.freeze({
  temperature: 60,
  humidity: 15,
  pm25: 200,
  pm10: 300,
});

const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutos

async function getThresholdsFor(deviceId) {
  try {
    if (deviceId) {
      const byDevice = await AlertThreshold.findOne({ where: { deviceId } });
      if (byDevice) return { source: "device", t: normalize(byDevice) };
    }
    const global = await AlertThreshold.findOne({ where: { deviceId: null } });
    if (global) return { source: "global", t: normalize(global) };
  } catch {
    // si no existe la tabla, defaults
  }
  return { source: "default", t: { ...DEFAULT_THRESHOLDS } };
}

function normalize(row) {
  return {
    temperature: Number(row.temperature),
    humidity: Number(row.humidity),
    pm25: Number(row.pm25),
    pm10: Number(row.pm10),
  };
}

/**
 * Crea alertas por violación de umbrales.
 * reading: { temperature, humidity, pm25, pm10 }
 */
export async function evaluateAndCreateAlerts(deviceId, reading) {
  const { source, t } = await getThresholdsFor(deviceId);
  const tag = source === "device" ? "[th:device]" : source === "global" ? "[th:global]" : "[th:default]";
  const now = Date.now();

  const checks = [
    {
      key: "pm25",
      type: "PM2.5",
      isBreach: (v) => Number.isFinite(v) && v > t.pm25,
      level: "warning",
      message: (v) => `PM2.5 alto: ${v} (umbral ${t.pm25}) ${tag}`,
    },
    {
      key: "pm10",
      type: "PM10",
      isBreach: (v) => Number.isFinite(v) && v > t.pm10,
      level: "warning",
      message: (v) => `PM10 alto: ${v} (umbral ${t.pm10}) ${tag}`,
    },
    {
      key: "temperature",
      type: "TEMP",
      isBreach: (v) => Number.isFinite(v) && v > t.temperature,
      level: (v) => (v > t.temperature + 10 ? "critical" : "warning"),
      message: (v) =>
        v > t.temperature + 10
          ? `Temperatura crítica: ${v} (umbral ${t.temperature}) ${tag}`
          : `Temperatura alta: ${v} (umbral ${t.temperature}) ${tag}`,
    },
    {
      key: "humidity",
      type: "HUMIDITY",
      isBreach: (v) => Number.isFinite(v) && v < t.humidity,
      level: "warning",
      message: (v) => `Humedad baja: ${v} (umbral ${t.humidity}) ${tag}`,
    },
  ];

  const created = [];

  for (const c of checks) {
    const value = Number(reading[c.key]);
    if (!c.isBreach(value)) continue;

    // Mute vigente
    const muted = await Alert.findOne({
      where: {
        deviceId,
        type: c.type,
        mutedUntil: { [Op.gt]: new Date(now) },
      },
      order: [["id", "DESC"]],
    });
    if (muted) continue;

    // Anti-spam
    const recent = await Alert.findOne({
      where: {
        deviceId,
        type: c.type,
        createdAt: { [Op.gt]: new Date(now - DEDUP_WINDOW_MS) },
      },
      order: [["id", "DESC"]],
    });
    if (recent) continue;

    const level = typeof c.level === "function" ? c.level(value) : c.level;
    const alert = await Alert.create({
      deviceId,
      type: c.type,
      message: c.message(value),
      level,
    });
    created.push(alert);
  }

  return created;
}
