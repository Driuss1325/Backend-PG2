const dayjs = require('dayjs');
const { DeviceEnrollToken } = require('../models');

exports.createEnrollToken = async ({ expiresAt, maxUses=1, createdBy=null, token }) => {
  return DeviceEnrollToken.create({
    token,
    expires_at: new Date(expiresAt),
    max_uses: maxUses,
    used_count: 0,
    created_by: createdBy
  });
};

exports.isValidEnrollToken = async (token) => {
  const t = await DeviceEnrollToken.findOne({ where: { token } });
  if (!t) return false;
  if (dayjs(t.expires_at).isBefore(dayjs())) return false;
  if (t.used_count >= t.max_uses) return false;
  return true;
};

exports.consumeEnrollToken = async (token) => {
  const t = await DeviceEnrollToken.findOne({ where: { token } });
  if (!t) return;
  await t.update({ used_count: t.used_count + 1 });
};
