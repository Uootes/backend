const { register, login, activate, forgotPassword, resetPassword, verifyOtp, getProfile, updateProfile, uploadProfilePicture } = require('../controllers/user');
const { submitUserComplaint } = require('../controllers/complaint');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const upload = require('../utils/multer');

const router = require('express').Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User registration and authentication
 */

/**
 * @swagger
 * /api/v1/signUp:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - confirmPassword
 *               - country
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Must be at least 6 characters
 *                 example: "password123"
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Must match password
 *                 example: "password123"
 *               country:
 *                 type: string
 *                 example: USA
 *               referralCode:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 10
 *                 description: Optional valid referral code
 *                 example: "GSCSO9Q50"
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: URL of the user's profile picture
 *                 example: "https://example.com/images/profile.jpg"
 *     responses:
 *       201:
 *         description: User registered successfully, OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully, OTP sent to email
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
 *                       example: user@example.com
 *                     country:
 *                       type: string
 *                       example: USA
 *                     accountType:
 *                       type: string
 *                       example: Bronze
 *                     profilePicture:
 *                       type: object
 *                       properties:
 *                         imageUrl:
 *                           type: string
 *                           example: "https://example.com/images/profile.jpg"
 *                         publicId:
 *                           type: string
 *                           example: "profile_pic_123"
 *                     referralCode:
 *                       type: string
 *                       example: GSCSO9Q50
 *                     referredBy:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439012
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: All fields are required
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Passwords do not match
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "User with email: user@example.com already exists"
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Invalid referral code
 *       500:
 *         description: Internal server error
 */
router.post('/signUp', upload.single('profilePicture'), register);

/**
 * @swagger
 * /api/v1/verifyOtp:
 *   post:
 *     summary: Verify OTP for user email verification
 *     tags: [User]
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
router.post('/verifyOtp', verifyOtp);

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Authenticate an existing user
 *     tags: [User]
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
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 description: User's 6-digit PIN
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User logged in successfully
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Unauthorized - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to login user
 */
router.post('/login', login)

/**
 * @swagger
 * /api/v1/forgotPassword:
 *   post:
 *     summary: Request password reset OTP
 *     description: Sends a 6-digit OTP to the user's email for password reset
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPin
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: User's registered email address
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Failed to send OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to send OTP
 */

router.post('/forgotPassword', forgotPassword)

/**
 * @swagger
 * /api/v1/resetPassword:
 *   post:
 *     summary: Reset user password
 *     description: Reset password using OTP verification
 *     tags: [User]
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
 *                 example: "123456"
 *                 description: 6-digit OTP received via email
 *               newPassword:
 *                 type: string
 *                 example: "newpassword123"
 *                 description: New password to set
 *               confirmPassword:
 *                 type: string
 *                 example: "newpassword123"
 *                 description: Confirm new password
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: Bad request - Invalid OTP, expired OTP, or passwords don't match
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid OTP
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error resetting password
 */
router.post('/resetPassword', resetPassword)
/**
 * @swagger
 * /api/v1/activate:
 *   post:
 *     summary: Activate user account
 *     description: |
 *       Activates the user's account by:
 *       - Verifying minimum 2.15 GSC balance
 *       - Deducting activation fee
 *       - Updating account status
 *       - Processing referral promotion
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account activated successfully
 *                 newBalance:
 *                   type: number
 *                   example: 10.85
 *                   description: Remaining GSC balance
 *       400:
 *         description: Insufficient balance (requires ≥2.15 GSC) or other client error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Insufficient balance to activate account
 *       401:
 *         description: Unauthorized (invalid/missing token)
 *       404:
 *         description: User or wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Wallet not found
 *       500:
 *         description: Server error during activation
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */ router.post('/activate', auth, activate)

router.patch("/activate",auth, activate)

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                       example: user@example.com
 *                     country:
 *                       type: string
 *                       example: USA
 *                     referralCode:
 *                       type: string
 *                       example: GSCSO9Q50
 *                     accountType:
 *                       type: string
 *                       example: Bronze
 *                     activationStatus:
 *                       type: string
 *                       example: active
 *                     profilePicture:
 *                       type: object
 *                       properties:
 *                         imageUrl:
 *                           type: string
 *                           example: "https://example.com/images/profile.jpg"
 *                         publicId:
 *                           type: string
 *                           example: "profile_pic_123"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 */
router.get('/profile', auth, getProfile);

/**
 * @swagger
 * /api/v1/profile:
 *   put:
 *     summary: Update the authenticated user's profile
 *     tags: [User]
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
 *         description: User not found
 */
router.put('/profile', auth, updateProfile);

/**
 * @swagger
 * /api/v1/profile/picture:
 *   post:
 *     summary: Upload or update the authenticated user's profile picture
 *     tags: [User]
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
 *                       example: "https://example.com/images/profile.jpg"
 *                     publicId:
 *                       type: string
 *                       example: "profile_pic_123"
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 */
router.post('/profile/picture', auth, upload.single('profilePicture'), uploadProfilePicture);

/**
 * @swagger
 * /api/v1/complaint:
 *   post:
 *     summary: Submit a complaint
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 example: "I am experiencing issues with my account activation."
 *     responses:
 *       201:
 *         description: Complaint submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Complaint submitted successfully. You will receive a confirmation email shortly.
 *                 complaint:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     description:
 *                       type: string
 *                       example: I am experiencing issues with my account activation.
 *                     status:
 *                       type: string
 *                       example: open
 *                     responseMessage:
 *                       type: string
 *                       example: Thank you for your complaint. We have received it and will review it carefully. Our team will work to resolve your issue and get back to you as soon as possible.
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Description is required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/complaint', auth, submitUserComplaint);

module.exports = router;
