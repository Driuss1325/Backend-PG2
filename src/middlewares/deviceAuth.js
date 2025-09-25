const dayjs = require('dayjs');
const { Device } = require('../models');
const { isValidEnrollToken, consumeEnrollToken } = require('../services/enroll.service');
const { genApiKey } = require('../utils/crypto');

module.exports = async function deviceAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    const deviceUid = req.headers['x-device-uid'];
    const devHost = req.headers['x-device-hostname'];
    const enrollToken = req.headers['x-enroll-token'];

    // 1) Modo API Key
    if (apiKey) {
      const device = await Device.findOne({ where: { api_key: apiKey, is_active: true } });
      if (!device) return res.status(401).json({ error: 'API key inválida' });
      req.device = device;
      return next();
    }

    // 2) Enrolamiento UID + token
    if (deviceUid && enrollToken) {
      const valid = await isValidEnrollToken(enrollToken);
      if (!valid) return res.status(401).json({ error: 'Enroll token inválido/expirado' });

      let device = await Device.findOne({ where: { device_uid: deviceUid } });
      if (!device) {
        const api_key = genApiKey();
        const name = devHost ? `Raspberry (${devHost})` : `Raspberry ${deviceUid}`;
        device = await Device.create({ device_uid: deviceUid, name, api_key, is_active: true });
        req.issuedApiKey = api_key; // se devolverá al Raspberry
        await consumeEnrollToken(enrollToken);
      }
      req.device = device;
      return next();
    }

    return res.status(401).json({ error: 'Falta x-api-key o (x-device-uid + x-enroll-token)' });
  } catch (e) {
    next(e);
  }
};
