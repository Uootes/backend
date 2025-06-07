const Referral = require("../models/referral");
const User = require("../models/user");

exports.initReferral = async (newUserId, referredById) => {
  const existingReferral = await Referral.findOne({ userId: newUserId });
  if (existingReferral) {
    throw new Error("User already has a referral document");
  }

  const newReferral = new Referral({
    userId: newUserId,
    referredBy: referredById,
    visitors: [],
    referrals: [],
    upgradeTokens: 0,
  });

  await newReferral.save();

  const referrer = await Referral.findOne({ userId: referredById });
  if (referrer) {
    referrer.visitors.push(newReferral._id);
    await referrer.save();
  }
};

exports.promoteVisitorToReferral = async (userId) => {
  try {
    const userReferral = await Referral.findOne({ userId });

    if (!userReferral || !userReferral.referredBy) {
      console.log("No referral or referrer found for this user.");
      return;
    }

    // Find the referrer
    const referrer = await Referral.findOne({
      userId: userReferral.referredBy,
    });

    if (!referrer) {
      console.log("Referrer not found in Referral collection.");
      return;
    }

    const visitorExists = referrer.visitors.some(
      (visitor) => visitor.userId.toString() === userId.toString()
    );

    if (visitorExists) {
      // Remove from VISITORS ARRAY
      referrer.visitors = referrer.visitors.filter(
        (visitor) => visitor.userId.toString() !== userId.toString()
      );
    }

    const existingInReferral = referrer.referrals.some(
      (referredUser) => referredUser.userId.toString() === userId.toString()
    );

    if (!existingInReferral) {
      referrer.referrals.push({ userId });
      referrer.upgradeTokens += 1;
    }

    await referrer.save();

    console.log("User promoted to referral successfully.");
  } catch (error) {
    console.error("Error promoting visitor to referral:", error);
  }
};

const upgradeAccount = async (req, res, next) => {
  try {
    const { id } = req.user;

    const referralDoc = await Referral.findOne({ _id: id });
    const user = await User.findById(id);

    if (!user || !referralDoc)
      return res.status(404).json({ message: "User not found" });

    if (user.accountType === "Bronze" && referralDoc.upgradeTokens >= 1) {
      user.accountType = "Silver";
    } else if (
      user.accountType === "Silver" &&
      referralDoc.upgradeTokens >= 5
    ) {
      user.accountType = "Gold";
    } else {
      return res.status(400).json({ message: "Not eligible for upgrade" });
    }

    await user.save();
    res
      .status(200)
      .json({ message: `Upgrade to ${user.accountType} successful` });
  } catch (error) {
    next(error);
  }
};

const getReferralInfo = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const referralDoc = await Referral.findOne({ userId });

    if (!referralDoc) {
      return res.status(404).json({ message: "Referral data not found" });
    };

    res.status(200).json({
      message: "Referral info fetched successfully",
      data: referralDoc,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upgradeAccount,
  getReferralInfo,
};
