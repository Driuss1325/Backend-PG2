'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('readings', {
      id: { type: S.BIGINT, autoIncrement: true, primaryKey: true },
      device_id: { type: S.INTEGER, allowNull: false },
      temperature: { type: S.FLOAT },
      humidity: { type: S.FLOAT },
      pm2_5: { type: S.FLOAT },
      pm10: { type: S.FLOAT },
      lat: { type: S.DECIMAL(9,6) },
      lng: { type: S.DECIMAL(9,6) },
      ts: { type: S.DATE, allowNull: false, defaultValue: S.fn('NOW') },
      created_at: { type: S.DATE, defaultValue: S.fn('NOW') },
      updated_at: { type: S.DATE, defaultValue: S.fn('NOW') }
    });
    await q.addIndex('readings', ['device_id','ts']);
    await q.addConstraint('readings', {
      fields: ['device_id'],
      type: 'foreign key',
      references: { table: 'devices', field: 'id' },
      onDelete: 'cascade',
      onUpdate: 'cascade',
      name: 'fk_readings_device'
    });
  },
  async down(q) {
    await q.dropTable('readings');
  }
};
