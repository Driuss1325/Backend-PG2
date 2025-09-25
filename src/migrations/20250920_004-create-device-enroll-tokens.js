'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('device_enroll_tokens', {
      id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      token: { type: S.STRING(128), allowNull: false, unique: true },
      expires_at: { type: S.DATE, allowNull: false },
      max_uses: { type: S.INTEGER, allowNull: false, defaultValue: 1 },
      used_count: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
      created_by: { type: S.INTEGER },
      created_at: { type: S.DATE, defaultValue: S.fn('NOW') },
      updated_at: { type: S.DATE, defaultValue: S.fn('NOW') }
    });
  },
  async down(q) {
    await q.dropTable('device_enroll_tokens');
  }
};
