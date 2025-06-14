const userModel = require('../models/user');
const userWalletModel = require('../models/userWallet');


exports.createWallet = async (userId) => {
  try {
    const existingWallet = await userWalletModel.findOne({ userId });

    if (existingWallet) {
      console.log('Wallet for this user already exist')
    };

    const wallet = new userWalletModel({
      userId
    });

    await wallet.save();
  } catch (error) {
    console.log('Error creating wallet:', error.message)
  }
};