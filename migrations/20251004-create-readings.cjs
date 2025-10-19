"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Readings", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      deviceId: { type: Sequelize.INTEGER, allowNull: false },
      temperature: { type: Sequelize.FLOAT },
      humidity: { type: Sequelize.FLOAT },
      pm25: { type: Sequelize.FLOAT },
      pm10: { type: Sequelize.FLOAT },
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
    await queryInterface.dropTable("Readings");
  },
};
