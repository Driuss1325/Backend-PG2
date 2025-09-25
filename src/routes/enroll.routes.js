const router = require('express').Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/enroll.controller');

router.post('/tokens', auth, ctrl.createToken);

module.exports = router;
