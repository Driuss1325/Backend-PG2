"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ApiKeys", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      deviceId: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      keyHash: { type: Sequelize.STRING, allowNull: false },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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
    await queryInterface.dropTable("ApiKeys");
  },
};
