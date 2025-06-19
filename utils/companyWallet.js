const companyWallet = require('../models/companyWallet');


exports.splittingRevenue = async (req, res) => {
  try {
    const wallet = await companyWallet.findOne();

    if (wallet === null) {
      console.log("Company's wallet not found")
    } else {
      let companyBal = wallet.companyBalance;
      let poolBal = wallet.poolBalance;
      let companyShare = wallet.revenueBalance * (53.49 / 100);
      let poolShare = wallet.revenueBalance * (46.51 / 100);
      companyBal += companyShare;
      poolBal += poolShare;
      wallet.companyBalance = companyBal;
      wallet.poolBalance = poolBal;
      wallet.revenueBalance = 0;
      await wallet.save();
      console.log("Revenue balance split successfully")
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: error.message
    });
  }
};


exports.getActivationToken = async (amount) => {
  const wallet = await companyWallet.findOne();

  if (wallet === null) {
    console.log("Company's wallet not found")
  } else {
    let revenueBal = wallet.revenueBalance;
    let accumulationBal = wallet.accumulation;
    revenueBal += amount;
    accumulationBal += amount;
    wallet.revenueBalance = revenueBal;
    wallet.accumulation = accumulationBal;
    await wallet.save();
    console.log("Activation token added to revenue successfully")
  }
}