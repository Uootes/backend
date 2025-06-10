const { register, login, activate , forgotPassword, resetPassword} = require('../controllers/user');
const { auth } = require('../middleware/auth');

const router = require('express').Router()

router.post('/signUp', register)
router.post('/login', login)
router.post('/forgotPassword', forgotPassword)
router.post('/resetPassword', resetPassword)
router.post('/activate', auth, activate)


module.exports = router;
