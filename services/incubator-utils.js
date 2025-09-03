const Incubator = require('../models/incubator');
const User = require('../models/user');
const userWalletModel = require('../models/userWallet');

async function createIncubatorCard( userId, cptAmount) {
  const wallet = await userWalletModel.findOne({ userId });
  const user = await User.findById(userId);
  if (!wallet || !user) throw new Error("User or wallet not found");

  const gscConversionRates = { Bronze: 0.0000301, Silver: 0.0000258, Gold: 0.0000215 };
  const tierDurations = {
    Bronze: 360 * 3600 * 1000,  // 360h
    Silver: 168 * 3600 * 1000,  // 168h
    Gold: 72 * 3600 * 1000,     // 72h
  };

// const tierDurations = {
//   Bronze: 10 * 60 * 1000,  // 10 minutes
//   Silver: 10 * 60 * 1000,  // 10 minutes
//   Gold: 10 * 60 * 1000,    // 10 minutes
// };

  const tier = user.accountType;
  const gscWorth = cptAmount * gscConversionRates[tier];
  const totalDuration = tierDurations[tier];

  // Add to incubator balance in wallet (optional if you want aggregate tracking)
  wallet.incubatorBalance += cptAmount;
  await wallet.save();

  // Create incubator card
  const incubatorCard = new Incubator({
    userId,
    tier,
    cptAmount,
    gscWorth,
    totalDuration,
    remainingTime: totalDuration,
    status: wallet.incubatorActivation?.isActivated ? "active" : "locked",
    ...(wallet.incubatorActivation?.isActivated && {
      startedAt: new Date(),
      endsAt: new Date(Date.now() + totalDuration),
    }),
  });

  await incubatorCard.save();

  return incubatorCard;
}

module.exports = { createIncubatorCard };