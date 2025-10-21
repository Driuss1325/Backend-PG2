"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Alerts", "acknowledged", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("Alerts", "acknowledgedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("Alerts", "mutedUntil", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Alerts", "acknowledged");
    await queryInterface.removeColumn("Alerts", "acknowledgedAt");
    await queryInterface.removeColumn("Alerts", "mutedUntil");
  },
};
