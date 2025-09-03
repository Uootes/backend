const express = require("express");
const router = express.Router();
const { activateIncubator, claimCard, createIncubator, getUserIncubatorCards, getIncubatorCardByID, getIncubatorStatus } = require("../controllers/incubator");
const { deactivateIncubator } = require("../controllers/incubator");
const { auth } = require("../middleware/auth");

/**
 * @swagger
 * /api/v1/incubator/activate:
 *   post:
 *     summary: Activate the incubator session
 *     description: >
 *       Activates the incubator session for a user if not already active.  
 *       - Requires a wallet to exist for the user.  
 *       - Sets all locked incubator cards to active, starting their timers.  
 *       - Session expires after 6 hours.  
 *       
 *       **Behavior Details:**  
 *       - If wallet not found → 404  
 *       - If incubator already active → 400  
 *       - On success, updates wallet and cards → 200
 *     tags: [Incubator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Incubator activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Incubator activated successfully
 *                 activationExpiresAt:
 *                   type: string
 *                   example: "2025-09-03T18:45:00Z"
 *       400:
 *         description: Incubator already active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Incubator already active
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Wallet not found
 *       500:
 *         description: Server error
 */
router.post("/activate",auth, activateIncubator);
// router.post("/deactivate", auth, deactivateIncubator);
/**
 * @swagger
 * /api/v1/incubator/cards:
 *   post:
 *     summary: Create a new incubator card
 *     description: >
 *       Creates an incubator card for the user using their CPT balance.  
 *       Requires the user and their wallet to exist.  
 *       
 *       **Behavior Details:**  
 *       - If wallet or user not found → 404  
 *       - On success → card is created and returned
 *     tags: [Incubator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cptAmount:
 *                 type: number
 *                 example: 50
 *     responses:
 *       201:
 *         description: Incubator card created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Incubator card created
 *                 card:
 *                   type: object
 *                   example:
 *                     _id: "64a7c2fbc8a1e7e12f8a9d23"
 *                     cptAmount: 50
 *                     gscWorth: 10
 *                     status: "locked"
 *       404:
 *         description: User or wallet not found
 *       500:
 *         description: Server error
 */
router.post("/cards", auth, createIncubator);


/**
 * @swagger
 * /api/v1/incubator/claim/{id}:
 *   post:
 *     summary: Claim a completed incubator card
 *     description: >
 *       Allows the user to claim an incubator card once it is in `claimable` status.  
 *       - Credits GSC to wallet.  
 *       - Credits CPT back to wallet.  
 *       - Marks card as `claimed` and deletes it.  
 *       
 *       **Behavior Details:**  
 *       - If card not found → 404  
 *       - If not claimable → 400  
 *       - On success → 200
 *     tags: [Incubator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the incubator card
 *     responses:
 *       200:
 *         description: Card claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Card claimed successfully
 *                 gscCredited:
 *                   type: number
 *                   example: 10
 *                 cptCredited:
 *                   type: number
 *                   example: 50
 *       400:
 *         description: Card not claimable
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
router.post("/claim/:id", auth, claimCard);

/**
 * @swagger
 * /api/v1/incubator/cards:
 *   get:
 *     summary: Get all incubator cards for a user
 *     description: >
 *       Retrieves all incubator cards belonging to the authenticated user.  
 *       - Each card includes: cptAmount, gscWorth, status, endsAt, and remainingTime.  
 *       - If card is active and has an endsAt timestamp, remainingTime is dynamically calculated.
 *     tags: [Incubator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of incubator cards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cards:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a7c2fbc8a1e7e12f8a9d23"
 *                       cptAmount:
 *                         type: number
 *                         example: 50
 *                       gscWorth:
 *                         type: number
 *                         example: 10
 *                       status:
 *                         type: string
 *                         example: active
 *                       endsAt:
 *                         type: string
 *                         example: "2025-09-03T20:00:00Z"
 *                       remainingTime:
 *                         type: number
 *                         example: 21500000
 *       500:
 *         description: Server error
 */
router.get("/cards/", auth, getUserIncubatorCards);


/**
 * @swagger
 * /api/v1/incubator/cards/{id}:
 *   get:
 *     summary: Get a single incubator card by ID
 *     description: >
 *       Retrieves an incubator card by its ID.  
 *       - If the card is active and has an endsAt timestamp, remainingTime is dynamically calculated.  
 *       - If card not found, returns an error.
 *     tags: [Incubator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the incubator card
 *     responses:
 *       200:
 *         description: Incubator card retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 card:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64a7c2fbc8a1e7e12f8a9d23"
 *                     cptAmount:
 *                       type: number
 *                       example: 50
 *                     gscWorth:
 *                       type: number
 *                       example: 10
 *                     status:
 *                       type: string
 *                       example: active
 *                     endsAt:
 *                       type: string
 *                       example: "2025-09-03T20:00:00Z"
 *                     remainingTime:
 *                       type: number
 *                       example: 20000000
 *       404:
 *         description: Card not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Card not found
 *       500:
 *         description: Server error
 */
router.get("/cards/:id", auth, getIncubatorCardByID);
/**
 * @swagger
 * /api/v1/incubator/status:
 *   get:
 *     summary: Get incubator status for a user
 *     description: >
 *       Retrieves the current incubator session status and all related incubator cards.  
 *       - Includes activation state, expiration time, and list of incubator cards.
 *     tags: [Incubator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Incubator status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isActivated:
 *                   type: boolean
 *                   example: true
 *                 activationExpiresAt:
 *                   type: string
 *                   example: "2025-09-03T20:00:00Z"
 *                 incubatorCards:
 *                   type: array
 *                   items:
 *                     type: object
 *                     example:
 *                       _id: "64a7c2fbc8a1e7e12f8a9d23"
 *                       cptAmount: 50
 *                       gscWorth: 10
 *                       status: "active"
 *                       endsAt: "2025-09-03T20:00:00Z"
 *                       remainingTime: 21000000
 *       404:
 *         description: Wallet not found
 *       500:
 *         description: Server error
 */
router.get("/status", auth, getIncubatorStatus);

module.exports = router;
