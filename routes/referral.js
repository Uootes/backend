const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral');
const { auth } = require('../middleware/auth');

router.post('/upgrade', referralController.upgradeAccount);

router.get('/:userId', referralController.getReferralInfo);

router.get("/cout", auth, referralController.getReferralAndVisitorsCount)

module.exports = router;
