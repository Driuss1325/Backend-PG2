import { Alert } from "../models/index.js";
export async function evaluateAndCreateAlerts(deviceId, reading) {
  const alerts = [];
  if (reading.pm25 != null && reading.pm25 > 100)
    alerts.push({
      type: "PM2.5",
      message: `PM2.5 alto: ${reading.pm25}`,
      level: "warning",
    });
  if (reading.pm10 != null && reading.pm10 > 150)
    alerts.push({
      type: "PM10",
      message: `PM10 alto: ${reading.pm10}`,
      level: "warning",
    });
  if (reading.temperature != null && reading.temperature > 45)
    alerts.push({
      type: "TEMP",
      message: `Temperatura crítica: ${reading.temperature}`,
      level: "critical",
    });
  const created = [];
  for (const a of alerts) created.push(await Alert.create({ deviceId, ...a }));
  return created;
}
