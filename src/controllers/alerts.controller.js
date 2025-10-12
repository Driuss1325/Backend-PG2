import { Alert } from "../models/index.js";
export async function listAlerts(req, res) {
  const rows = await Alert.findAll({ order: [["id", "DESC"]], limit: 200 });
  res.json(rows);
}
