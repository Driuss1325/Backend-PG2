// src/controllers/reports.controller.js
import { buildReportXLSX } from "../services/report.service.js";

function safeIso(v) {
  try { return v ? new Date(v).toISOString() : null; } catch { return null; }
}

export async function downloadReportXlsx(req, res) {
  // Acepta from/to o dateFrom/dateTo
  const deviceId = req.query.deviceId || req.query.deviceid;
  const dateFrom = req.query.from || req.query.dateFrom;
  const dateTo   = req.query.to   || req.query.dateTo;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  const fromIso = safeIso(dateFrom);
  const toIso   = safeIso(dateTo);

  // Nombre de archivo
  const fFrom = fromIso ? fromIso.slice(0,19).replace(/[:T]/g, "-") : "NA";
  const fTo   = toIso   ? toIso.slice(0,19).replace(/[:T]/g, "-")   : "NA";
  const filename = `reporte_device_${deviceId}_${fFrom}_${fTo}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );

  await buildReportXLSX(res, { deviceId, dateFrom: fromIso, dateTo: toIso });
  // exceljs cierra el stream
}
