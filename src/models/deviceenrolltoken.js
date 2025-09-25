'use strict';
module.exports = (sequelize, DataTypes) => {
  const DeviceEnrollToken = sequelize.define('DeviceEnrollToken', {
    token: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    max_uses: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    used_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_by: { type: DataTypes.INTEGER }
  }, { tableName: 'device_enroll_tokens', underscored: true });

  DeviceEnrollToken.associate = (models) => {
    DeviceEnrollToken.belongsTo(models.User, { foreignKey: 'created_by' });
  };
  return DeviceEnrollToken;
};
