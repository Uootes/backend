const { register, login, activate , forgotPassword, resetPassword} = require('../controllers/user');
const { auth } = require('../middleware/auth');

const router = require('express').Router()
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration and authentication
 */

/**
 * @swagger
 * /api/v1/signUp:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - pin
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               pin:
 *                 type: string
 *                 description: 4-6 digit PIN
 *                 example: "1234"
 *               referralCode:
 *                 type: string
 *                 description: Optional referral code
 *                 example: "REF123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email already in use
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to register user
 */
router.post('/signUp', register);
router.post('/signUp', register)
router.post('/login', login)
router.post('/forgotPassword', forgotPassword)
router.post('/resetPassword', resetPassword)
router.post('/activate', auth, activate)


module.exports = router;
