import { ApiKey, Device } from "../models/index.js";
import { verifyKey } from "../utils/hash.js";

export async function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  const deviceId = Number(req.headers["x-device-id"]);
  if (!key) return res.status(401).json({ error: "x-api-key requerido" });
  if (!deviceId)
    return res.status(400).json({ error: "x-device-id requerido" });
  const dbKey = await ApiKey.findOne({ where: { deviceId, active: true } });
  if (!dbKey) return res.status(403).json({ error: "ApiKey no activa" });
  const ok = await verifyKey(key, dbKey.keyHash);
  if (!ok) return res.status(403).json({ error: "ApiKey inválida" });
  const dev = await Device.findByPk(deviceId);
  if (!dev) return res.status(404).json({ error: "Dispositivo no encontrado" });
  req.device = dev;
  next();
}
