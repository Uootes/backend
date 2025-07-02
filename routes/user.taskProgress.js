const express = require('express');
const router = express.Router();
const userTaskProgressController = require('../controllers/userTaskProgress');
const { auth } = require('../middleware/auth');

router.post('/', auth, userTaskProgressController.accessUserTaskProgress );

router.patch('/:taskId', auth, userTaskProgressController.updateTaskStatus);

router.get("/progress", auth, userTaskProgressController.getUserTaskProgress);

router.get('/',auth,  userTaskProgressController.getUserProgressCount);

module.exports = router