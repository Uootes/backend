const userModel = require('../models/user');
const exchangerWalletModel = require('../models/exchangerWallet');


exports.createWallet = async (exchangerId) => {
  try {
    const existingWallet = await exchangerWalletModel.findOne({ exchangerId });

    if (existingWallet) {
      console.log('Wallet for this exchanger already exist')
    };

    const wallet = new exchangerWalletModel({
      exchangerId
    });

    await wallet.save();
  } catch (error) {
    console.log('Error creating wallet:', error.message)
  }
};