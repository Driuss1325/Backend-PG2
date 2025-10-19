"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("CommunityPosts", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      authorName: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      lat: { type: Sequelize.FLOAT },
      lng: { type: Sequelize.FLOAT },
      status: {
        type: Sequelize.ENUM("visible", "hidden"),
        allowNull: false,
        defaultValue: "visible",
      },
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
    await queryInterface.dropTable("CommunityPosts");
  },
};
