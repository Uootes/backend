const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/referrals:
 *   patch:
 *     summary: Upgrade user account tier based on available upgrade tokens
 *     description: >
 *       This endpoint upgrades the authenticated user's account type based on their available upgrade tokens.
 *       <br><br>
 *       **Upgrade Rules:**
 *       - **Bronze → Silver**: Requires at least 1 upgrade token  
 *       - **Silver → Gold**: Requires at least 5 upgrade tokens  
 *       - **Gold**: Already at highest tier; cannot upgrade further  
 *       
 *       Tokens are deducted upon successful upgrade. If the user lacks sufficient tokens, an appropriate message is returned.
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account upgrade successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Upgrade to Silver successful.
 *                 accountType:
 *                   type: string
 *                   example: Silver
 *       400:
 *         description: Upgrade failed due to ineligibility or insufficient tokens
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Account is already Gold.
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Not enough tokens for Silver upgrade. Requires 1 token, has 0.
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Not enough tokens for Gold upgrade. Requires 5 token, you currently have 2 tokens.
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Not eligible for upgrade based on current account type or token balance.
 *       404:
 *         description: User or referral document not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User or Referral document not found.
 *       500:
 *         description: Server error during account upgrade process
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An error occurred while upgrading the account. please try again later
 *                 error:
 *                   type: string
 *                   example: Unexpected error
 */
router.patch('/',auth, referralController.upgradeAccount);

/**
 * @swagger
 * tags:
 *   name: Referrals
 *   description: Endpoints related to the referral system
 */

/**
 * @swagger
 * /api/v1/referrals:
 *   get:
 *     summary: Retrieve referral data for the logged-in user
 *     description: >
 *       This endpoint fetches the referral details for the currently authenticated user. It returns information such as:
 *       - the user's unique referral code,
 *       - a list of referred users (by ID),
 *       - the total number of successful referrals,
 *       - accumulated rewards (e.g., in CPT tokens or other units),
 *       - and the current referral tier (e.g., Bronze, Silver, Gold).
 *       <br><br>
 *       This information helps users track their referral progress and earned incentives within the Web3-inspired platform.
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral info fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Referral info fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: 6644f2e9c5d7a0e35f9c8b91
 *                     referralCode:
 *                       type: string
 *                       example: GSCSO9Q50
 *                     referrals:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["6650eaf72a5de34027df4abc", "6650eb132a5de34027df4abd"]
 *                     referralCount:
 *                       type: integer
 *                       example: 2
 *                     rewardEarned:
 *                       type: number
 *                       format: float
 *                       example: 15.75
 *                     tier:
 *                       type: string
 *                       example: Silver
 *       401:
 *         description: Unauthorized – User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Referral data not found for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Referral data not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred
 */
router.get('/', auth,referralController.getReferralInfo);

/**
 * @swagger
 * /api/v1/referrals/count:
 *   get:
 *     summary: Get referral and visitor counts for the authenticated user
 *     description: >
 *       This endpoint returns a simple count of:
 *       
 *       - Total number of users referred directly by the logged-in user  
 *       - Total number of unique visitors who accessed the user’s referral link  
 *       
 *       This provides a quick overview of a user’s referral activity and reach within the platform.
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User referral and visitors count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User referral and visitors count retrieved successfully
 *                 referrals:
 *                   type: integer
 *                   example: 4
 *                 visitors:
 *                   type: integer
 *                   example: 12
 *       401:
 *         description: Unauthorized – User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: User not found – No referral data exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error – Failed to retrieve count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An error occurred while retrieving referral and visitors count
 *                 error:
 *                   type: string
 *                   example: Unexpected error
 */
router.get("/count", auth, referralController.getReferralAndVisitorsCount)


/**
 * @swagger
 * /api/v1/referrals/dashboarddata:
 *   get:
 *     summary: Get detailed dashboard data of direct referrals
 *     description: >
 *       This endpoint provides dashboard-style insights for the authenticated user who has referred others.
 *       It returns a list of all directly referred users along with key metrics for each, such as:
 *       
 *       - Full name and referral code of the referred user  
 *       - Activation status and account type (e.g., Bronze, Silver, Gold)  
 *       - Number of visitors that the referred user has received  
 *       - Number of users that the referred user has directly referred  
 *       
 *       This helps the referrer visualize the performance of their downline and engagement across the referral network.
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Referral dashboard data retrieved successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: 685ead1f87087af303be6a62
 *                       fullName:
 *                         type: string
 *                         example: Moishe Ferrucci
 *                       referralCode:
 *                         type: string
 *                         example: SOMECODE123
 *                       activationStatus:
 *                         type: boolean
 *                         example: true
 *                       accountType:
 *                         type: string
 *                         example: Silver
 *                       visitorsCount:
 *                         type: integer
 *                         example: 0
 *                       referralsCount:
 *                         type: integer
 *                         example: 0
 *                 totalDirectReferrals:
 *                   type: integer
 *                   example: 2
 *       401:
 *         description: Unauthorized – User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Referral data not found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Referral data not found for this user.
 *       500:
 *         description: Internal server error – Failed to retrieve referrer dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to retrieve referrer dashboard data.
 *                 error:
 *                   type: string
 *                   example: Unexpected error occurred
 */
router.get('/dashboarddata', auth, referralController.getReferrerDashboardData);

module.exports = router;
