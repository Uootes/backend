const Incubator = require('../models/incubator');
const User = require('../models/user');
const userWalletModel = require('../models/userWallet');

async function createIncubatorCard(userId, cptAmount) {
  const wallet = await userWalletModel.findOne({ userId });
  const user = await User.findById(userId);
  if (!wallet || !user) throw new Error("User or wallet not found");

  const gscConversionRates = { Bronze: 0.0000301, Silver: 0.0000258, Gold: 0.0000215 };

  const tierDurations = {
    Bronze: 24 * 60 * 60 * 1000,  // 24 hours
    Silver: 12 * 60 * 60 * 1000,  // 12 hours
    Gold: 6 * 60 * 60 * 1000,     // 6 hours
  };

  const tier = user.accountType;
  const gscWorth = cptAmount * gscConversionRates[tier];
  const totalDuration = tierDurations[tier];

  // Add to incubator balance in wallet
  wallet.incubatorBalance += cptAmount;
  await wallet.save();

  // Create incubator card - always start as active
  const incubatorCard = new Incubator({
    userId,
    tier,
    cptAmount,
    gscWorth,
    totalDuration,
    remainingTime: totalDuration,
    status: "active",
    startedAt: new Date(),
    endsAt: new Date(Date.now() + totalDuration),
  });

  await incubatorCard.save();

  return incubatorCard;
}

module.exports = { createIncubatorCard };