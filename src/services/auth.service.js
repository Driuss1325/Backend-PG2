const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

exports.login = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  const token = jwt.sign(
    { uid: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
};
