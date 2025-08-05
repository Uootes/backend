const express = require('express');
const router = express.Router();
const { submitComplaint, submitUserComplaint, submitExchangerComplaint, getComplaints, resolveComplaint } = require('../controllers/complaint');
const { auth, authorizeRole } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Complaint management system for users, exchangers, and customerservice staff
 */

/**
 * @swagger
 * /api/v1/complaints:
 *   post:
 *     summary: Submit a new complaint (customerservice staff only)
 *     tags: [Complaints]
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
 *                 example: "The product arrived damaged."
 *     responses:
 *       201:
 *         description: Complaint submitted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - customerservice role required
 *       500:
 *         description: Server error
 */
router.post('/', auth, authorizeRole('customerservice'), submitComplaint);

/**
 * @swagger
 * /api/v1/complaints/user:
 *   post:
 *     summary: Submit a complaint as a user
 *     tags: [Complaints]
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
 *         description: Complaint submitted successfully with automatic response
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
 *                     customerType:
 *                       type: string
 *                       example: User
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
router.post('/user', auth, submitUserComplaint);

/**
 * @swagger
 * /api/v1/complaints/exchanger:
 *   post:
 *     summary: Submit a complaint as an exchanger
 *     tags: [Complaints]
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
 *                 example: "I am having trouble with the exchange process."
 *     responses:
 *       201:
 *         description: Complaint submitted successfully with automatic response
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
 *                       example: I am having trouble with the exchange process.
 *                     status:
 *                       type: string
 *                       example: open
 *                     responseMessage:
 *                       type: string
 *                       example: Thank you for your complaint. We have received it and will review it carefully. Our team will work to resolve your issue and get back to you as soon as possible.
 *                     customerType:
 *                       type: string
 *                       example: Exchanger
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
router.post('/exchanger', auth, submitExchangerComplaint);

/**
 * @swagger
 * /api/v1/complaints:
 *   get:
 *     summary: Get all complaints (customerservice staff only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of complaints retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 complaints:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       description:
 *                         type: string
 *                         example: I am experiencing issues with my account activation.
 *                       status:
 *                         type: string
 *                         enum: [open, in-progress, resolved]
 *                         example: open
 *                       responseMessage:
 *                         type: string
 *                         example: Thank you for your complaint. We have received it and will review it carefully.
 *                       customerType:
 *                         type: string
 *                         enum: [User, Exchanger]
 *                         example: User
 *                       customerId:
 *                         type: object
 *                         description: Populated user or exchanger details
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       resolvedBy:
 *                         type: object
 *                         description: Admin who resolved the complaint (if resolved)
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Access denied - customerservice role required
 *       500:
 *         description: Server error
 */
router.get('/', auth, authorizeRole('customerservice'), getComplaints);

/**
 * @swagger
 * /api/v1/complaints/{id}/resolve:
 *   patch:
 *     summary: Resolve a complaint (customerservice staff only)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The complaint ID
 *     responses:
 *       200:
 *         description: Complaint resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Complaint resolved successfully
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
 *                       example: resolved
 *                     customerType:
 *                       type: string
 *                       example: User
 *                     resolvedBy:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439012
 *                     resolvedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Complaint is already resolved
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Access denied - customerservice role required
 *       404:
 *         description: Complaint not found
 *       500:
 *         description: Server error
 */
router.put('/:id/resolve', auth, authorizeRole('customerservice'), resolveComplaint);

module.exports = router;
