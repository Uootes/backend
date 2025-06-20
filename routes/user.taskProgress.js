const express = require('express');
const router = express.Router();
const userTaskProgressController = require('../controllers/userTaskProgress');
const { auth } = require('../middleware/auth');

router.get('/initialize', auth, userTaskProgressController.accessUserTaskProgress );

router.patch('/', auth, userTaskProgressController.updateTaskStatus);

router.get('/', userTaskProgressController.getUserProgressCount);

module.exports = router