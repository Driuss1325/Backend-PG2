'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('devices', {
      id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      device_uid: { type: S.STRING(128), allowNull: false, unique: true },
      name: { type: S.STRING(100), allowNull: false },
      lat: { type: S.DECIMAL(9,6) },
      lng: { type: S.DECIMAL(9,6) },
      api_key: { type: S.STRING(128), allowNull: false },
      is_active: { type: S.BOOLEAN, defaultValue: true },
      last_seen: { type: S.DATE },
      created_at: { type: S.DATE, defaultValue: S.fn('NOW') },
      updated_at: { type: S.DATE, defaultValue: S.fn('NOW') }
    });
  },
  async down(q) {
    await q.dropTable('devices');
  }
};
