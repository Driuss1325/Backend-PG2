"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("DeviceLocationLogs", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      deviceId: { type: Sequelize.INTEGER, allowNull: false },
      lat: { type: Sequelize.DECIMAL(9, 6), allowNull: false },
      lng: { type: Sequelize.DECIMAL(9, 6), allowNull: false },
      source: {
        type: Sequelize.ENUM("agent", "manual"),
        allowNull: false,
        defaultValue: "agent",
      },
      accuracy: { type: Sequelize.FLOAT },
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
    await queryInterface.dropTable("DeviceLocationLogs");
  },
};
