const Referral = require("../models/referral");
const User = require("../models/user");

const initReferral = async (newUserId, referredById, newUserName) => {

  const existingReferral = await Referral.findOne({ userId: newUserId });
  if (existingReferral) {

    console.warn(`Referral document already exists for user ID: ${newUserId}. Skipping creation.`);
    return
  };

  const newReferral = new Referral({
    userId: newUserId,
    userFullName: newUserName,
    referredBy: referredById,
    visitors: [],
    referrals: [],
    upgradeTokens: 0,
  });

  await newReferral.save();

  if (referredById) {
    const referrerReferralDoc = await Referral.findOne({ userId: referredById });

    if (referrerReferralDoc) {
      const visitorExists = referrerReferralDoc.visitors.some(
        (visitor) => visitor.userId.equals(newUserId)
      );

      if (!visitorExists) {
        referrerReferralDoc.visitors.push({
          userId: newUserId,
          fullName: newUserName,
          joinedAt: new Date(),
        });

        await referrerReferralDoc.save();
        console.log(`User ${newUserName} (${newUserId}) added to referrer ${referredById}'s visitors.`);
      } else {
        console.log(`User ${newUserName} (${newUserId}) is already in referrer ${referredById}'s visitors array.`);
      };

    } else {
      console.warn(`Referrer Referral document not found for user ID: ${referredById}. Cannot add visitor.`);
    };
  };
};

const promoteVisitorToReferral = async (userId) => {
  try {
    const activatedUser = await User.findById(userId);
    if (!activatedUser) {
      console.warn(`User with ID ${userId} not found during referral promotion.`);
      return;
    };

    const activatedUserFullName = `${activatedUser.firstName} ${activatedUser.lastName}`;

    const userReferralDoc = await Referral.findOne({ userId });

    if (!userReferralDoc || !userReferralDoc.referredBy) {
      console.log(`No referral document or referrer found for user: ${userId}. Skipping referral promotion.`);
      return;
    };

    // Find the referrer's referral document
    const referrerReferralDoc = await Referral.findOne({
      userId: userReferralDoc.referredBy,
    });

    if (!referrerReferralDoc) {
      console.warn(`Referrer's Referral document not found for user ID: ${userReferralDoc.referredBy}. Cannot promote visitor.`);
      return;
    };

    // const initialVisitorsCount = referrerReferralDoc.visitors.length;
    referrerReferralDoc.visitors = referrerReferralDoc.visitors.filter(
      (visitor) => !visitor.userId.equals(userId)
    );

    // Add the activated user to the referrer's referrals array, if not already there
    const existingInReferrals = referrerReferralDoc.referrals.some(
      (referredUser) => referredUser.userId.equals(userId)
    );

    if (!existingInReferrals) {
      referrerReferralDoc.referrals.push({
        userId: activatedUser._id,
        fullName: activatedUserFullName,
        activatedAt: new Date(),
      });

      referrerReferralDoc.upgradeTokens += 1;
      console.log(`User ${activatedUserFullName} (${userId}) successfully promoted to referral for referrer ${userReferralDoc.referredBy}. Upgrade token added.`);

    } else {
      console.log(`User ${activatedUserFullName} (${userId}) is already in referrer ${userReferralDoc.referredBy}'s referrals array. No action needed.`);
    };

    await referrerReferralDoc.save();

  } catch (error) {
    console.error("Error promoting visitor to referral:", error);
    throw new Error("Failed to promote visitor to referral: " + error.message);
  }
};

const upgradeAccount = async (req, res, next) => {
  try {
    const  id = req.user.id;

    const referralDoc = await Referral.findOne({ _id: id });
    const user = await User.findById(id);
    if (!user || !referralDoc) {
      return res
        .status(404)
        .json({ message: "User or Referral document not found." });
    };

    if (user.accountType === "Bronze" && referralDoc.upgradeTokens >= 1) {
      user.accountType = "Silver";
      referralDoc.upgradeTokens -= 1;

      await user.save();
      await referralDoc.save();

      return res.status(200).json({
        message: "Upgrade to Silver successful.",
        accountType: user.accountType,
      });
    }

    if (user.accountType === "Silver" && referralDoc.upgradeTokens >= 5) {
      user.accountType = "Gold";
      referralDoc.upgradeTokens -= 5;

      await user.save();
      await referralDoc.save();

      return res.status(200).json({
        message: "Upgrade to Gold successful.",
        accountType: user.accountType,
      });
    }

    if (user.accountType === "Gold") {
      return res.status(400).json({ message: "Account is already Gold." });
    }

    if (user.accountType === "Silver" && referralDoc.upgradeTokens < 5) {
      return res
        .status(400)
        .json({
          message: `Not enough tokens for Gold upgrade. Requires 5, yo currently have ${referralDoc.upgradeTokens} tokens.`,
        });
    }

    if (user.accountType === "Bronze" && referralDoc.upgradeTokens < 1) {
      return res
        .status(400)
        .json({
          message: `Not enough tokens for Silver upgrade. Requires 1, has ${referralDoc.upgradeTokens}.`,
        });
    }

    return res
      .status(400)
      .json({
        message:
          "Not eligible for upgrade based on current account type or token balance.",
      });
  } catch (error) {
    console.error("Error during account upgrade:", error);
    next(error);
  }
};

const getReferralInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const referralDoc = await Referral.findOne({ userId });

    if (!referralDoc) {
      return res.status(404).json({ message: "Referral data not found" });
    }

    res.status(200).json({
      message: "Referral info fetched successfully",
      data: referralDoc,
    });
  } catch (error) {
    next(error);
  }
};

const getReferrerDashboardData = async (req, res, next) => {
  try {
    const referrerId = req.user.id;
    const referrerReferralDoc = await Referral.findOne({ userId: referrerId })
      .populate({
        path: 'referrals',
        model: 'User',
        select: 'firstName lastName referralCode accountType'
      })
      .exec();
    if (!referrerReferralDoc) {
      return res.status(404).json({ message: "Referral data not found for this user." });
    }

    const dashboardReferralsData = [];
    for (const directReferralUser of referrerReferralDoc.referrals) {
      const directReferralReferralDoc = await Referral.findOne({ userId: directReferralUser._id });

      let visitorsCount = 0;
      let referralsCount = 0;

      if (directReferralReferralDoc) {
        visitorsCount = directReferralReferralDoc.visitors.length;
        referralsCount = directReferralReferralDoc.referrals.length;
      }

      dashboardReferralsData.push({
        id: directReferralUser._id,
        firstName: directReferralUser.firstName,
        lastName: directReferralUser.lastName,
        referralCode: directReferralUser.referralCode,
        accountType: directReferralUser.accountType,
        visitorsCount: visitorsCount,
        referralsCount: referralsCount
      });
    }

    return res.status(200).json({
      message: 'Referral dashboard data retrieved successfully.',
      data: dashboardReferralsData,
      totalDirectReferrals: dashboardReferralsData.length
    });

  } catch (error) {
    console.error('Error fetching referrer dashboard data:', error);
    next(error);
  }
};

exports.findUser = async function (userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
  catch (error) {
    throw new Error("Error finding user: " + error.message);
  }
};

exports.findReferralDoc = async function (userId) {
  try {
    const referral = await Referral.findOne({ userId });
    if (!referral) {
      throw new Error("Referral document not found for this user");
    }
    return referral;
  } catch (error) {
    throw new Error("Error finding referral document: " + error.message);
  }

}

const getReferralAndVisitorsCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await Referral.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const referralCount = user.referrals.length;
    const visitorCount = user.visitors.length;

    res.status(200).json({
      message: "User referral and visitors count retrieved successfully",
      referrals: referralCount,
      visitors: visitorCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initReferral,
  promoteVisitorToReferral,
  upgradeAccount,
  getReferralInfo,
  getReferralAndVisitorsCount,
  getReferrerDashboardData
};
