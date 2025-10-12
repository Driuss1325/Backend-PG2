"use strict";
const bcrypt = require("bcryptjs");
module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash("admin123", 10);
    await queryInterface.bulkInsert("Users", [
      {
        name: "Admin",
        email: "admin@fireguard.local",
        passwordHash: hash,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete("Users", {
      email: "admin@fireguard.local",
    });
  },
};
