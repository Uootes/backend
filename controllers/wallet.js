const userModel = require('../models/user');
const walletModel = require('../models/userWallet');


exports.createWallet = async (userId) => {
  try {
    const existingWallet = await walletModel.findOne({ userId });

    if (existingWallet) {
      console.log('Wallet for this user already exist')
    };

    const wallet = new walletModel({
      userId
    });

    await wallet.save();
  } catch (error) {
    console.log('Error creating wallet:', error.message)
  }
};