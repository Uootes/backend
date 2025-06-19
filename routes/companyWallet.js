const { createCompanyWallet } = require('../controllers/companyWallet');

const router = require('express').Router();

router.post('/create-company-wallet', createCompanyWallet)

module.exports = router;