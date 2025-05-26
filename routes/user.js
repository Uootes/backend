const { register, login, activate } = require('../controllers/user');

const router = require('express').Router()

router.post('/signUp', register)
router.post('/login', login)
router.post('/activate', activate)


module.exports = router;