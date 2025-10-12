import { buildReportPDF } from "../services/report.service.js";
export async function downloadReport(req, res) {
  const { deviceId, dateFrom, dateTo } = req.query;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=report_device_${deviceId}.pdf`
  );
  await buildReportPDF(res, { deviceId, dateFrom, dateTo });
}
