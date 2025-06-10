const { register, login, activate , forgotPassword, resetPassword} = require('../controllers/exchanger');
const { auth } = require('../middleware/auth');

const router = require('express').Router();

router.post('/signUp-exchanger', register);
router.post('/login-exchanger', login);
router.post('/forgotPassword-exchanger', forgotPassword);
router.post('/resetPassword-exchanger', resetPassword);
router.post('/activate-exchanger', auth, activate);

module.exports = router;
