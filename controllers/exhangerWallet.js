const userModel = require('../models/user');
const walletModel = require('../models/exchangerWallet');


exports.createWallet = async (exchangerId) => {
  try {
    const existingWallet = await walletModel.findOne({ exchangerId });

    if (existingWallet) {
      console.log('Wallet for this exchanger already exist')
    };

    const wallet = new walletModel({
      exchangerId
    });

    await wallet.save();
  } catch (error) {
    console.log('Error creating wallet:', error.message)
  }
};