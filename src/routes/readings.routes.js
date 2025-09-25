const router = require('express').Router();
const auth = require('../middlewares/auth');
const deviceAuth = require('../middlewares/deviceAuth');
const ctrl = require('../controllers/readings.controller');

router.get('/', auth, ctrl.list);
router.post('/', ctrl.ingestLimiter, deviceAuth, ctrl.ingest);

module.exports = router;
