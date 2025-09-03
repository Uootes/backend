const Incubator = require("../models/incubator.js");
const userWalletModel = require("../models/userWallet");
const User = require("../models/user");
const { createIncubatorCard } = require("../services/incubator-utils.js");
// activation duration in ms (6 hours)
const ACTIVATION_DURATION = 6 * 60 * 60 * 1000;

//Activate incubator session
exports.activateIncubator = async (req, res) => {
    try {
        const userId = req.user.id;

        let wallet = await userWalletModel.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        // already active
        if (wallet.incubatorActivation.isActivated && wallet.incubatorActivation.activationExpiresAt > Date.now()) {
            return res.status(400).json({ message: "Incubator already active" });
        };

        // activate
        wallet.incubatorActivation.isActivated = true;
        wallet.incubatorActivation.activationExpiresAt = Date.now() + ACTIVATION_DURATION;
        await wallet.save();

        // Resume locked cards and set to active
        await Incubator.updateMany(
            { userId, status: "locked" },
            {
                $set: {
                    status: "active",
                    startedAt: Date.now(),
                    endsAt: Date.now() + ACTIVATION_DURATION,
                },
            }
        );

        return res.status(200).json({
            message: "Incubator activated successfully",
            activationExpiresAt: wallet.activationExpiresAt,
        });
    } catch (error) {
        console.error("Error activating incubator:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Create Incubator Card
exports.createIncubator = async (req, res) => {
    const userId = req.user.id;
    const { cptAmount } = req.body;

    // Get user wallet & profile
    const wallet = await userWalletModel.findOne({ userId });
    const user = await User.findById(userId);
    if (!wallet || !user) {
        return res.status(404).json({ message: "User or wallet not found" });
    }
    const card = await createIncubatorCard(userId, cptAmount);

    res.status(201).json({ message: "Incubator card created", card });
};

exports.getUserIncubatorCards = async (req, res) => {
    const userId = req.user.id;
    const cards = await Incubator.find({ userId }).select('cptAmount gscWorth status endsAt remainingTime');

    // Compute remainingTime dynamically for active ones
    const now = Date.now();
    const formatted = cards.map(card => {
        if (card.status === "active" && card.endsAt) {
            card.remainingTime = Math.max(0, card.endsAt.getTime() - now);
        }
        return cards;
    });

    res.json({ cards: formatted });
};

exports.getIncubatorCardByID = async (req, res) => {
    const { id } = req.params;
    const card = await Incubator.findById(id);
    if (!card) throw new Error("Card not found");

    if (card.status === "active" && card.endsAt) {
        card.remainingTime = Math.max(0, card.endsAt.getTime() - Date.now());
    }

    res.json({ card });
};

exports.claimCard = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const card = await Incubator.findOne({ _id: id, userId });
    if (!card) throw new Error("Card not found");
    if (card.status !== "claimable") return res.status(400).json({ messae: "Card not claimable" });

    //Credit user wallet
    const wallet = await userWalletModel.findOne({ userId });
    wallet.GSCBalance += card.gscWorth;
    card.CPTBalance += card.cptAmount;
    await wallet.save();

    // Update card status
    card.status = "claimed";
    await card.save();

    await Incubator.deleteOne({ _id: id });

    res.json({ message: "Card claimed successfully", gscCredited: card.gscWorth, cptCredited: card.cptAmount });
};

exports.getIncubatorStatus = async (req, res) => {
    const userId = req.user.id;
    const wallet = await userWalletModel.findOne({ userId });
    const incubatorCards = await Incubator.find({ userId }).select('cptAmount gscWorth status endsAt remainingTime');
    if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
    }

    if (!incubatorCards || incubatorCards.length === 0) {
        return null;
    }

    res.json({
        isActivated: wallet?.incubatorActivation?.isActivated || false,
        activationExpiresAt: wallet?.incubatorActivation?.activationExpiresAt || null,
        incubatorCards
    });
}

// Cron job to auto-complete cards
exports.completeCountdown = async () => {
    try {
        const now = Date.now();

        // Find all expired active cards
        const expiredCards = await Incubator.find({
            status: "active",
            endsAt: { $lte: now },
        });

        for (const card of expiredCards) {
            if (card.remainingTime = 0 && card.status === "active" && card.endsAt > now) { card.status = "claimable"; }
            card.status = "claimable";
            card.remainingTime = 0;
            await card.save();
        }

        if (expiredCards.length > 0) {
            console.log(`Auto-completed ${expiredCards.length} incubator cards`);
        }
    } catch (err) {
        console.error("Error in autoCompleteJob:", err);
    }
};

//Deactivate incubator session(cron job)
exports.deactivateActivation = async () => {
    try {
        const now = Date.now();

        // Find wallets whose activation expired
        const expiredWallets = await userWalletModel.find({
            "incubatorActivation.isActivated": true,
            "incubatorActivation.activationExpiresAt": { $lte: now },
        });

        for (const wallet of expiredWallets) {
            wallet.incubatorActivation.isActivated = false;
            wallet.incubatorActivation.activationExpiresAt = null;
            await wallet.save();

            // Lock all active incubator cards for this user
            const activeCards = await Incubator.find({
                userId: wallet.userId,
                status: "active"
            });

            for (const card of activeCards) {
                const remainingTime = card.endsAt ? Math.max(card.endsAt - now, 0) : 0;
                card.status = "locked";
                card.remainingTime = remainingTime;
                await card.save();
            }

            console.log(
                `Deactivated incubator for user ${wallet.userId}, locked ${activeCards.length} cards`
            );
        }
    } catch (err) {
        console.error("Error in autoDeactivateJob:", err);
    }
};
