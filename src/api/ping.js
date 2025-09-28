module.exports = (req, res) => {
  res.status(200).json({ pong: true, url: req.url });
};
