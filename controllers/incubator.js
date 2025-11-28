const Incubator = require("../models/incubator.js");
const userWalletModel = require("../models/userWallet");
const User = require("../models/user");
const { createIncubatorCard } = require("../services/incubator-utils.js");

// Create Incubator Card
exports.createIncubator = async (req, res) => {
    try {
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
    } catch (error) {
        console.error("Error creating incubator card:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getUserIncubatorCards = async (req, res) => {
    try {
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
    } catch (error) {
        console.error("Error fetching incubator cards:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getIncubatorCardByID = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Incubator.findById(id);
        if (!card) throw new Error("Card not found");

        if (card.status === "active" && card.endsAt) {
            card.remainingTime = Math.max(0, card.endsAt.getTime() - Date.now());
        }

        res.json({ card });
    } catch (error) {
        console.error("Error fetching incubator card:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.claimCard = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const card = await Incubator.findOne({ _id: id, userId });
        if (!card) throw new Error("Card not found");
        if (card.status !== "claimable") return res.status(400).json({ messae: "Card not claimable" });

        //Credit user wallet
        const wallet = await userWalletModel.findOne({ userId });
        card.CPTBalance += card.cptAmount;
        await wallet.save();

        // Update card status
        card.status = "claimed";
        await card.save();

        await Incubator.deleteOne({ _id: id });

        res.json({ message: "Card claimed successfully", gscWorth: card.gscWorth, cptCredited: card.cptAmount });

    } catch (error) {
        console.error("Error claiming incubator card:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }

};

exports.getIncubatorStatus = async (req, res) => {
    try {
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
            incubatorCards
        });
    } catch (error) {
        console.error("Error fetching incubator status:", error);
        return res.status(500).json({ message: "Server error" });
    }
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
