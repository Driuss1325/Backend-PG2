import {
  Reading,
  DeviceLog,
  Device,
  DeviceLocationLog,
} from "../models/index.js";
import { evaluateAndCreateAlerts } from "../services/alert.service.js";
import { emitReading, emitAlert } from "../services/socket.service.js";

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
