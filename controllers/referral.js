const Referral = require("../models/referral");
const User = require("../models/user");

const initReferral = async (newUserId, referredById) => {
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

const promoteVisitorToReferral = async (userId) => {
    try {
        // find the person thy referred
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
        const { userId } = req.user;

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


const getReferralAndVisitorsCount = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const user = await Referral.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const referralCount = user.referrals.length();
        const visitorCount = user.visitors.length();

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
