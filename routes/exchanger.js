const { register, login, forgotPassword, resetPassword, verifyOtp } = require('../controllers/exchanger');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const upload = require('../utils/multer');

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - country
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               country:
 *                 type: string
 *                 example: USA
 *               email:
 *                 type: string
 *                 example: exchanger@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               confirmPassword:
 *                 type: string
 *                 example: password123
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: URL of the exchanger's profile picture
 *                 example: "https://example.com/images/exchanger-profile.jpg"
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
router.post('/signUp-exchanger', upload.single('profilePicture'), register);

/**
 * @swagger
 * /api/v1/verifyOtp-exchanger:
 *   post:
 *     summary: Verify OTP for exchanger email verification
 *     tags: [Exchanger]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Internal Server Error
 */
router.post('/verifyOtp-exchanger', verifyOtp);

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
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: exchanger@example.com
 *               password:
 *                 type: string
 *                 example: password123
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
 *             required:
 *               - email
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
 *             required:
 *               - otp
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               otp:
 *                 type: string
 *                 example: 123456
 *               newPassword:
 *                 type: string
 *                 example: newpassword123
 *               confirmPassword:
 *                 type: string
 *                 example: newpassword123
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

module.exports = router;
