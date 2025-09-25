'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('users', {
      id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: S.STRING, allowNull: false, unique: true },
      password_hash: { type: S.STRING, allowNull: false },
      name: { type: S.STRING, allowNull: false },
      role: { type: S.ENUM('admin','viewer'), allowNull: false, defaultValue: 'admin' },
      created_at: { type: S.DATE, defaultValue: S.fn('NOW') },
      updated_at: { type: S.DATE, defaultValue: S.fn('NOW') }
    });
  },
  async down(q) {
    await q.dropTable('users');
  }
};
