const { register, login, activate } = require('../controllers/exchanger');

const router = require('express').Router();

router.post('/signUp', register);
router.post('/login', login);
router.post('/activate', activate);

module.exports = router;
