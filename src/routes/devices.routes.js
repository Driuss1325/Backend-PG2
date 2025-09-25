const router = require('express').Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/devices.controller');

router.get('/', auth, ctrl.list);
router.post('/', auth, ctrl.create);
router.patch('/:id', auth, ctrl.patch);
router.post('/:id/rotate-key', auth, ctrl.rotateKey);
router.get('/:id/latest', auth, ctrl.latest);

module.exports = router;
