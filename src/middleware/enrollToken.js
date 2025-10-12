export function requireEnrollToken(req, res, next) {
  const tok = req.headers["x-enroll-token"];
  if (!tok || tok !== process.env.ENROLL_TOKEN) {
    return res.status(403).json({ error: "Enroll token inválido" });
  }
  next();
}
