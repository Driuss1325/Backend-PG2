const crypto = require('crypto');

exports.genApiKey = () => crypto.randomBytes(32).toString('hex'); // 64 hex chars
exports.genRandomToken = () => crypto.randomBytes(24).toString('hex');
