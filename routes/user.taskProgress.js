const express = require('express');
const router = express.Router();
const userTaskProgressController = require('../controllers/userTaskProgress');
const { auth } = require('../middleware/auth');

router.get('/', auth, userTaskProgressController.accessUserTaskProgress );

router.patch('/', auth, userTaskProgressController.updateTaskStatus);

router.get("/progress", auth, userTaskProgressController.getUserTaskProgress);

router.get('/',auth,  userTaskProgressController.getUserProgressCount);

module.exports = router