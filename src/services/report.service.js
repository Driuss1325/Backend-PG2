// src/services/report.service.js
import { Op } from "sequelize";
import ExcelJS from "exceljs";
import { Reading, Device } from "../models/index.js";

function safeDate(v) {
  try {
    return v ? new Date(v) : null;
  } catch { return null; }
}

function fmtDate(d) {
  return d instanceof Date && !isNaN(d) ? d.toISOString() : "-";
}

/**
 * Genera y envía un Excel con:
 *  - Hoja "Resumen" con dispositivo, rango y métricas.
 *  - Hoja "Lecturas" con tabla tabulada y filtros.
 *
 * @param {ServerResponse} res  response (stream)
 * @param {{ deviceId: number|string, dateFrom?: string, dateTo?: string }} params
 */
export async function buildReportXLSX(res, { deviceId, dateFrom, dateTo }) {
  // Normaliza params (acepta 'from'/'to' o 'dateFrom'/'dateTo')
  const from = safeDate(dateFrom);
  const to   = safeDate(dateTo);
  const device = await Device.findByPk(deviceId);

  // Filtro
  const where = { deviceId: Number(deviceId) };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = from;
    if (to)   where.createdAt[Op.lte] = to;
  }

  const rows = await Reading.findAll({
    where,
    order: [["createdAt", "ASC"]],
    raw: true,
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FireGuard";
  workbook.title = "FireGuard Reporte de Lecturas";

  // ===== Hoja Resumen =====
  const ws1 = workbook.addWorksheet("Resumen");
  ws1.columns = [
    { header: "Campo", key: "k", width: 28 },
    { header: "Valor", key: "v", width: 60 },
  ];

  const genAt = new Date();

  ws1.addRow({ k: "Título", v: "FireGuard Reporte de Lecturas" });
  ws1.addRow({ k: "Dispositivo", v: device?.name ? `${device.name} (#${device.id})` : `#${deviceId}` });
  ws1.addRow({ k: "Rango (desde)", v: fmtDate(from) });
  ws1.addRow({ k: "Rango (hasta)", v: fmtDate(to) });
  ws1.addRow({ k: "Total de lecturas", v: String(rows.length) });
  ws1.addRow({ k: "Generado en", v: fmtDate(genAt) });

  ws1.getRow(1).font = { bold: true };
  ws1.getRow(2).font = { bold: true };
  ws1.getColumn(1).font = { bold: true };

  // ===== Hoja Lecturas =====
  const ws2 = workbook.addWorksheet("Lecturas");

  ws2.columns = [
    { header: "Fecha (UTC)", key: "createdAt", width: 24 },
    { header: "Temperatura (°C)", key: "temperature", width: 18 },
    { header: "Humedad (%)", key: "humidity", width: 14 },
    { header: "PM2.5 (µg/m³)", key: "pm25", width: 16 },
    { header: "PM10 (µg/m³)", key: "pm10", width: 16 },
  ];

  // Cabecera con estilo
  ws2.getRow(1).font = { bold: true };
  ws2.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  ws2.autoFilter = {
    from: { row: 1, column: 1 },
    to:   { row: 1, column: ws2.columns.length },
  };
  ws2.views = [{ state: "frozen", ySplit: 1 }];

  for (const r of rows) {
    ws2.addRow({
      createdAt: r.createdAt ? new Date(r.createdAt) : null,
      temperature: r.temperature ?? null,
      humidity: r.humidity ?? null,
      pm25: r.pm25 ?? null,
      pm10: r.pm10 ?? null,
    });
  }

  // Formato de fecha para toda la columna A
  ws2.getColumn("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss";

  // Bordes suaves
  ws2.eachRow((row, idx) => {
    row.eachCell((cell) => {
      cell.border = {
        top:    { style: idx === 1 ? "medium" : "thin" },
        left:   { style: "thin" },
        bottom: { style: "thin" },
        right:  { style: "thin" },
      };
    });
  });

  // Escribe el workbook en el stream de respuesta
  await workbook.xlsx.write(res);
}
