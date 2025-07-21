const { register, login, forgotPassword, resetPassword, verifyOtp, getProfile, updateProfile, uploadProfilePicture } = require('../controllers/exchanger');
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
 *         description: Exchanger registered successfully, OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exchanger registered successfully, OTP sent to email
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     email:
 *                       type: string
 *                       example: exchanger@example.com
 *                     country:
 *                       type: string
 *                       example: USA
 *                     accountType:
 *                       type: string
 *                       example: regular
 *                     kycStatus:
 *                       type: string
 *                       example: pending
 *                     activationStatus:
 *                       type: boolean
 *                       example: false
 *                     profilePicture:
 *                       type: object
 *                       properties:
 *                         imageUrl:
 *                           type: string
 *                           example: "https://example.com/images/exchanger-profile.jpg"
 *                         publicId:
 *                           type: string
 *                           example: "exchanger_profile_pic_123"
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
 *               - newPassword
 *               - confirmPassword
 *             properties:
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
router.post('/resetPassword-exchanger/:id', resetPassword);


/**
 * @swagger
 * tags:
 *   name: Exchanger Profile
 *   description: Exchanger profile management
 */

/**
 * @swagger
 * /api/v1/profile-exchanger:
 *   get:
 *     summary: Get the authenticated exchanger's profile
 *     tags: [Exchanger Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exchanger profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     email:
 *                       type: string
 *                       example: exchanger@example.com
 *                     country:
 *                       type: string
 *                       example: USA
 *                     accountType:
 *                       type: string
 *                       example: regular
 *                     activationStatus:
 *                       type: boolean
 *                       example: false
 *                     profilePicture:
 *                       type: object
 *                       properties:
 *                         imageUrl:
 *                           type: string
 *                           example: "https://example.com/images/exchanger-profile.jpg"
 *                         publicId:
 *                           type: string
 *                           example: "exchanger_profile_pic_123"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Exchanger not found
 */
router.get('/profile-exchanger', auth, getProfile);

/**
 * @swagger
 * /api/v1/profile-exchanger:
 *   put:
 *     summary: Update the authenticated exchanger's profile
 *     tags: [Exchanger Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 profile:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     country:
 *                       type: string
 *                       example: USA
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Exchanger not found
 */
router.put('/profile-exchanger', auth, updateProfile);

/**
 * @swagger
 * /api/v1/profile-exchanger/picture:
 *   post:
 *     summary: Upload or update the authenticated exchanger's profile picture
 *     tags: [Exchanger Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: The profile picture file to upload
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile picture updated successfully
 *                 profilePicture:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       example: "https://example.com/images/exchanger-profile.jpg"
 *                     publicId:
 *                       type: string
 *                       example: "exchanger_profile_pic_123"
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Exchanger not found
 */
router.post('/profile-exchanger/picture', auth, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;
