const companyWallet = require('../models/companyWallet');


exports.createCompanyWallet = async (req, res) => {
  try {
    const { revenueBalance } = req.body;
    const checkWallet = await companyWallet.findOne();

    if (checkWallet !== null) {
      return "Wallet already exist for the company"
    };

    const wallet = new companyWallet({revenueBalance});
    res.status(201).json({status: true, message: "Company's wallet created successfully", data: wallet})
  } catch (error) {
    res.status(500).json({ status: false, message: "Error creating company's wallet: " + error.message })
  }
};