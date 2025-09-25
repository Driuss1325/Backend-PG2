const router = require('express').Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/reports.controller');

router.get('/readings.pdf', auth, ctrl.readingsPdf);

module.exports = router;
