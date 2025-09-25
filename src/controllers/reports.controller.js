const { streamReadingsPDF } = require('../services/report.service');

exports.readingsPdf = async (req, res) => {
  const { deviceId, from, to, limit } = req.query || {};
  if (!deviceId) return res.status(400).json({ error: 'deviceId requerido' });
  await streamReadingsPDF({ deviceId, from, to, limit }, res);
};
