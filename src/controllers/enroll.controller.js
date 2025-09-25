const dayjs = require('dayjs');
const { genRandomToken } = require('../utils/crypto');
const { createEnrollToken } = require('../services/enroll.service');

exports.createToken = async (req, res) => {
  const { expiresAt, maxUses } = req.body || {};
  if (!expiresAt) return res.status(400).json({ error: 'expiresAt requerido' });
  const token = genRandomToken();
  const t = await createEnrollToken({
    token,
    expiresAt,
    maxUses: maxUses ?? 1,
    createdBy: req.user?.uid ?? null
  });
  res.status(201).json({ token: t.token, expires_at: t.expires_at, max_uses: t.max_uses });
};
