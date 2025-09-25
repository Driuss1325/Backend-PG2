const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');
const { Device, Reading } = require('../models');

exports.streamReadingsPDF = async ({ deviceId, from, to, limit=200 }, res) => {
  const device = await Device.findByPk(deviceId);
  if (!device) return res.status(404).json({ error: 'Device no encontrado' });

  const { Op } = require('sequelize');
  const where = { device_id: deviceId };
  const ops = {};
  if (from) ops[Op.gte] = new Date(from);
  if (to) ops[Op.lte] = new Date(to);
  if (Object.keys(ops).length) where.ts = ops;

  const rows = await Reading.findAll({
    where,
    order: [['ts','DESC']],
    limit: Number(limit),
    attributes: ['temperature','humidity','pm2_5','pm10','lat','lng','ts']
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="readings-${device.device_uid}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  doc.pipe(res);

  doc.fontSize(18).text('Reporte de Lecturas - FireGuard');
  doc.moveDown(0.3);
  doc.fontSize(12).text(`Dispositivo: ${device.name} (${device.device_uid})`);
  doc.text(`Ubicación: ${device.lat ?? '-'}, ${device.lng ?? '-'}`);
  doc.text(`Generado: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
  doc.moveDown(0.8);

  doc.fontSize(12).text('Últimas lecturas:', { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(10);
  rows.forEach(r => {
    const line = `[${dayjs(r.ts).format('YYYY-MM-DD HH:mm:ss')}] `
      + `T=${r.temperature?.toFixed(2)}°C  H=${r.humidity?.toFixed(2)}%  `
      + `PM2.5=${r.pm2_5?.toFixed(2)}  PM10=${r.pm10?.toFixed(2)}  `
      + `(${r.lat ?? device.lat ?? '-'}, ${r.lng ?? device.lng ?? '-'})`;
    doc.text(line);
  });

  doc.end();
};
