const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral');

router.post('/upgrade', referralController.upgradeAccount);

router.get('/:userId', referralController.getReferralInfo);

module.exports = router;
