'use strict';
module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define('Device', {
    device_uid: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    lat: { type: DataTypes.DECIMAL(9,6) },
    lng: { type: DataTypes.DECIMAL(9,6) },
    api_key: { type: DataTypes.STRING(128), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_seen: { type: DataTypes.DATE }
  }, { tableName: 'devices', underscored: true });

  Device.associate = (models) => {
    Device.hasMany(models.Reading, { foreignKey: 'device_id' });
  };
  return Device;
};
