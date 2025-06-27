const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral');
const { auth } = require('../middleware/auth');

router.patch('/',auth, referralController.upgradeAccount);

router.get('/', auth,referralController.getReferralInfo);

router.get("/count", auth, referralController.getReferralAndVisitorsCount)

router.get('/dashboarddata', auth, referralController.getReferrerDashboardData);

module.exports = router;
