"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("DeviceLogs", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      deviceId: { type: Sequelize.INTEGER, allowNull: false },
      event: { type: Sequelize.STRING, allowNull: false },
      details: { type: Sequelize.JSON },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("DeviceLogs");
  },
};
