const express = require('express');
const router = express.Router();
const { 
  createAdmin, 
  login, 
  changePassword, 
  forgotPassword, 
  resetPassword,
  getDashboard,
  getUsers,
  getTokenSettings,
  updateTokenSettings,
  toggleUserStatus,
  getUserTransactions,
  withdrawFromCompanyBalance
} = require('../controllers/admin');
const { auth, authorizeRole } = require('../middleware/auth');
const multer = require('multer');
const upload = require('../utils/multer');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management and authentication
 */

/**
 * @swagger
 * /api/v1/admin/create:
 *   post:
 *     summary: Superadmin creates a new admin or customerservice user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Alice
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@example.com
 *               role:
 *                 type: string
 *                 enum: [admin, customerservice]
 *                 example: admin
 *     responses:
 *       201:
 *         description: Admin created and login details sent via email
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/create', auth, authorizeRole('superadmin'), createAdmin);

/**
 * @swagger
 * /api/v1/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
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
 *                 example: alice@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Admin logged in successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/admin/change-password:
 *   post:
 *     summary: Admin changes password
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 example: newpassword123
 *               confirmPassword:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/change-password', auth, changePassword);

/**
 * @swagger
 * /api/v1/admin/forgot-password:
 *   post:
 *     summary: Admin forgot password - send OTP
 *     tags: [Admin]
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
 *                 format: email
 *                 example: admin@example.com
 *     responses:
 *       200:
 *         description: Password reset OTP sent to email
 *       400:
 *         description: Bad request
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/v1/admin/reset-password:
 *   post:
 *     summary: Admin reset password with OTP
 *     tags: [Admin]
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
 *               newPassword:
 *                 type: string
 *                 example: newpassword123
 *               confirmPassword:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request or invalid OTP
 *       500:
 *         description: Server error
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard', auth, getDashboard);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users with search and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or referral ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: accountType
 *         schema:
 *           type: string
 *           enum: [Bronze, Silver, Gold]
 *         description: Filter by account type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [activated, suspended]
 *         description: Filter by activation status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/users', auth, authorizeRole('admin'), getUsers);

/**
 * @swagger
 * /api/v1/admin/users/{userId}/status:
 *   put:
 *     summary: Suspend or activate user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [suspend, activate]
 *                 example: suspend
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/users/:userId/status', auth, authorizeRole('admin'), toggleUserStatus);

/**
 * @swagger
 * /api/v1/admin/users/{userId}/transactions:
 *   get:
 *     summary: Get user transaction history
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/users/:userId/transactions', auth, authorizeRole('admin'), getUserTransactions);

/**
 * @swagger
 * /api/v1/admin/token-settings:
 *   get:
 *     summary: Get current token settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/token-settings', auth, authorizeRole('admin'), getTokenSettings);

/**
 * @swagger
 * /api/v1/admin/token-settings:
 *   put:
 *     summary: Update token settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplyBalance:
 *                 type: number
 *                 example: 5000000000
 *               cptBuyingPrice:
 *                 type: number
 *                 example: 0.00004
 *               cptSellingPrice:
 *                 type: object
 *                 properties:
 *                   bronze:
 *                     type: number
 *                     example: 0.0000301
 *                   silver:
 *                     type: number
 *                     example: 0.0000258
 *                   gold:
 *                     type: number
 *                     example: 0.0000215
 *               activationFee:
 *                 type: number
 *                 example: 2.5
 *               depositLimits:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                     example: 5
 *                   max:
 *                     type: number
 *                     example: 1000000
 *               withdrawalLimits:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                     example: 100
 *                   max:
 *                     type: number
 *                     example: 1000000
 *     responses:
 *       200:
 *         description: Token settings updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/token-settings', auth, authorizeRole('superadmin'), updateTokenSettings);

/**
 * @swagger
 * /api/v1/admin/withdraw-company-balance:
 *   post:
 *     summary: Withdraw from company balance
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1000
 *               description:
 *                 type: string
 *                 example: Monthly operational expenses
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Bad request or insufficient balance
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/withdraw-company-balance', auth, authorizeRole('superadmin'), withdrawFromCompanyBalance);

module.exports = router;
