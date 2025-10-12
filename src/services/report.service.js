import PDFDocument from "pdfkit";
import { Op } from "sequelize";
import { Reading, Device } from "../models/index.js";

export async function buildReportPDF(res, { deviceId, dateFrom, dateTo }) {
  const device = await Device.findByPk(deviceId);
  const where = { deviceId };
  if (dateFrom || dateTo) where.createdAt = {};
  if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
  if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);

  const rows = await Reading.findAll({ where, order: [["createdAt", "ASC"]] });

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(18).text("FireGuard Reporte de Lecturas", { align: "center" });
  doc
    .moveDown()
    .fontSize(12)
    .text(`Dispositivo: ${device?.name || deviceId}`);
  doc.text(`Rango: ${dateFrom || "-"} a ${dateTo || "-"}`);
  doc.moveDown();

  rows.forEach((r) => {
    doc.text(
      `${r.createdAt.toISOString()} | T=${r.temperature ?? "-"}°C | H=${
        r.humidity ?? "-"
      }% | PM2.5=${r.pm25 ?? "-"} | PM10=${r.pm10 ?? "-"}`
    );
  });

  doc.end();
}
