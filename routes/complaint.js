const express = require('express');
const router = express.Router();
const { submitComplaint, getComplaints, resolveComplaint } = require('../controllers/complaint');
const { auth, authorizeRole } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Complaints management for customerservice
 */

/**
 * @swagger
 * /api/v1/complaints:
 *   post:
 *     summary: Submit a new complaint
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
 *       500:
 *         description: Server error
 */
router.post('/', auth, authorizeRole('customerservice'), submitComplaint);

/**
 * @swagger
 * /api/v1/complaints:
 *   get:
 *     summary: Get all complaints
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of complaints
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, authorizeRole('customerservice'), getComplaints);

/**
 * @swagger
 * /api/v1/complaints/{id}/resolve:
 *   put:
 *     summary: Resolve a complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Complaint ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complaint resolved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Complaint not found
 *       500:
 *         description: Server error
 */
router.put('/:id/resolve', auth, authorizeRole('customerservice'), resolveComplaint);

module.exports = router;
