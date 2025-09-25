const { login } = require('../services/auth.service');

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });
  const result = await login(email, password);
  if (!result) return res.status(401).json({ error: 'Credenciales inválidas' });
  res.json(result);
};
