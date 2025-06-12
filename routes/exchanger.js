const { register, login, activate , forgotPassword, resetPassword} = require('../controllers/exchanger');
const { auth } = require('../middleware/auth');

const router = require('express').Router();

/**
 * @swagger
 * tags:
 *   name: Exchanger
 *   description: Exchanger management and authentication
 */

/**
 * @swagger
 * /api/v1/signUp-exchanger:
 *   post:
 *     summary: Register a new exchanger
 *     tags: [Exchanger]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: exchanger@example.com
 *               pin:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Exchanger registered successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error registering exchanger: <error-message>"
 */
router.post('/signUp-exchanger', register);

/**
 * @swagger
 * /api/v1/login-exchanger:
 *   post:
 *     summary: Login an exchanger
 *     tags: [Exchanger]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: exchanger@example.com
 *               pin:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error logging in exchanger: <error-message>"
 */
router.post('/login-exchanger', login);

/**
 * @swagger
 * /api/v1/forgotPassword-exchanger:
 *   post:
 *     summary: Request password reset for exchanger
 *     tags: [Exchanger]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: exchanger@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: Exchanger not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error sending password reset email: <error-message>"
 */
router.post('/forgotPassword-exchanger', forgotPassword);

/**
 * @swagger
 * /api/v1/resetPassword-exchanger:
 *   post:
 *     summary: Reset exchanger password
 *     tags: [Exchanger]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: exchanger@example.com
 *               otp:
 *                 type: string
 *                 example: 123456
 *               newPin:
 *                 type: string
 *                 example: 678909
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or request
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error resetting password: <error-message>"
 */
router.post('/resetPassword-exchanger', resetPassword);

module.exports = router;
