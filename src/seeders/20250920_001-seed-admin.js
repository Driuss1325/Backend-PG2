'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash('admin123', 10);
    await queryInterface.bulkInsert('users', [{
      email: 'admin@fireguard.local',
      password_hash: hash,
      name: 'Administrador',
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@fireguard.local' });
  }
};
