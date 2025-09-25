'use strict';
module.exports = (sequelize, DataTypes) => {
  const Reading = sequelize.define('Reading', {
    device_id: { type: DataTypes.INTEGER, allowNull: false },
    temperature: { type: DataTypes.FLOAT },
    humidity: { type: DataTypes.FLOAT },
    pm2_5: { type: DataTypes.FLOAT },
    pm10: { type: DataTypes.FLOAT },
    lat: { type: DataTypes.DECIMAL(9,6) },
    lng: { type: DataTypes.DECIMAL(9,6) },
    ts: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'readings',
    underscored: true,
    indexes: [{ fields: ['device_id','ts'] }]
  });

  Reading.associate = (models) => {
    Reading.belongsTo(models.Device, { foreignKey: 'device_id' });
  };
  return Reading;
};
