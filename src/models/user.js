'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin','viewer'), allowNull: false, defaultValue: 'admin' }
  }, { tableName: 'users', underscored: true });

  User.associate = (models) => {
    User.hasMany(models.DeviceEnrollToken, { foreignKey: 'created_by' });
  };
  return User;
};
