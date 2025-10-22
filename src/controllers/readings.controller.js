import {
  Reading,
  DeviceLog,
  Device,
  DeviceLocationLog,
} from "../models/index.js";
import { evaluateAndCreateAlerts } from "../services/alert.service.js";
import { emitReading, emitAlert } from "../services/socket.service.js";
import { sendAlertEmail } from "../services/email.service.js"; // ⟵ NUEVO
import { Op } from "sequelize";

export async function ingestReading(req, res) {
  const { temperature, humidity, pm25, pm10, lat, lng, accuracy } = req.body;
  const deviceId = req.device.id;

  // 1) Persistir lectura
  const reading = await Reading.create({
    deviceId,
    temperature,
    humidity,
    pm25,
    pm10,
  });

  // 2) Notificar por WebSocket la lectura
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

  // 3) Actualizar ubicación si cambió (y loguear)
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

  // 4) Evaluar reglas y crear alertas
  const alerts = await evaluateAndCreateAlerts(deviceId, {
    temperature,
    humidity,
    pm25,
    pm10,
  });

  // 5) Emitir alertas por WS
  for (const a of alerts) emitAlert(a);

  // 6) Enviar emails por cada alerta (API SES) SIN bloquear la respuesta
  //    - Enviamos en paralelo
  //    - Registramos logs de éxito/falla
  if (alerts.length) {
    const sendJobs = alerts.map(async (a) => {
      try {
        await sendAlertEmail(a);
        await DeviceLog.create({
          deviceId,
          event: "ALERT_EMAIL_SENT",
          details: { alertId: a.id, type: a.type, level: a.level },
        });
      } catch (err) {
        // No romper el flujo si falla el correo; dejar evidencia en logs
        await DeviceLog.create({
          deviceId,
          event: "ALERT_EMAIL_FAILED",
          details: {
            alertId: a.id,
            type: a.type,
            level: a.level,
            error: String(err?.message || err),
          },
        });
      }
    });

    // Ejecutar en background (no esperes para responder al dispositivo)
    // Si prefieres esperar, usa: await Promise.allSettled(sendJobs);
    Promise.allSettled(sendJobs).catch(() => {});
  }

  // 7) Log general de ingesta
  await DeviceLog.create({
    deviceId,
    event: "READING_INGESTED",
    details: { temperature, humidity, pm25, pm10 },
  });

  // 8) Responder inmediatamente
  res.status(201).json({ ok: true });
}

export async function getReadings(req, res, next) {
  try {
    const deviceId = req.query.deviceId ?? req.query.device_id;
    const limitRaw = Number(req.query.limit ?? 100);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 5000)
      : 100;
    const order =
      String(req.query.order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

    const since = req.query.since ? new Date(req.query.since) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const where = {};
    if (deviceId != null && deviceId !== "") where.deviceId = Number(deviceId);

    if (since || to) {
      where.createdAt = {};
      if (since && !isNaN(since)) where.createdAt[Op.gte] = since;
      if (to && !isNaN(to)) where.createdAt[Op.lte] = to;
    }

    const rows = await Reading.findAll({
      where,
      order: [["createdAt", order]],
      limit,
      attributes: [
        "id",
        "deviceId",
        "temperature",
        "humidity",
        "pm25",
        "pm10",
        "createdAt",
      ],
    });

    res.json({ data: rows });
  } catch (err) {
    next?.(err) ?? res.status(500).json({ error: "Internal error" });
  }
}
