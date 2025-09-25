const { Device, Reading } = require('../models');

exports.listDevices = async () => {
  return Device.findAll({
    attributes: ['id','device_uid','name','lat','lng','is_active','last_seen','created_at']
  });
};

exports.createDevice = async ({ device_uid, name, lat=null, lng=null, api_key }) => {
  const dev = await Device.create({ device_uid, name, lat, lng, api_key, is_active: true });
  return dev;
};

exports.updateDevice = async (id, { name, lat, lng, is_active }) => {
  const dev = await Device.findByPk(id);
  if (!dev) return null;
  await dev.update({ name: name ?? dev.name, lat: lat ?? dev.lat, lng: lng ?? dev.lng, is_active: (is_active ?? dev.is_active) });
  return dev;
};

exports.rotateDeviceKey = async (id, api_key) => {
  const dev = await Device.findByPk(id);
  if (!dev) return null;
  await dev.update({ api_key });
  return dev;
};

exports.bumpLastSeen = async (id, lat=null, lng=null) => {
  const dev = await Device.findByPk(id);
  if (!dev) return null;
  await dev.update({ last_seen: new Date(), lat: lat ?? dev.lat, lng: lng ?? dev.lng });
  return dev;
};

exports.latestReading = async (id) => {
  return Reading.findOne({ where: { device_id: id }, order: [['ts','DESC']] });
};
