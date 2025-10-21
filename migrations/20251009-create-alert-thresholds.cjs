"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("AlertThresholds", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      deviceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
        comment: "NULL = global thresholds; otherwise per device",
      },
      temperature: { type: Sequelize.FLOAT, allowNull: false },
      humidity: { type: Sequelize.FLOAT, allowNull: false },
      pm25: { type: Sequelize.FLOAT, allowNull: false },
      pm10: { type: Sequelize.FLOAT, allowNull: false },
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
    await queryInterface.dropTable("AlertThresholds");
  },
};
