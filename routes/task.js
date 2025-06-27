// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task');

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Admin-only endpoints for creating and managing platform tasks
 */

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     description: >
 *       This endpoint allows the creation of a new task by providing a title, description, and optional link.
 *       <br><br>
 *       - Titles are converted to lowercase before checking for duplicates.  
 *       - If a task with the same title already exists, the request will fail.
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: Complete onboarding
 *               description:
 *                 type: string
 *                 example: User must complete the onboarding process
 *               link:
 *                 type: string
 *                 example: https://example.com/onboarding
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task created successfully
 *                 task:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60f7d3f8b30b5c001c8e4a5b
 *                     title:
 *                       type: string
 *                       example: complete onboarding
 *                     description:
 *                       type: string
 *                       example: User must complete the onboarding process
 *                     link:
 *                       type: string
 *                       example: https://example.com/onboarding
 *       400:
 *         description: Task creation failed due to duplication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task already exist
 *       500:
 *         description: Server error during task creation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: Validation failed or internal error message
 */
router.post('/', taskController.createTask);

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Retrieve all platform tasks
 *     description: >
 *       This endpoint returns a list of all available tasks on the platform, including their titles,
 *       descriptions, associated links (if any), and active status.  
 *       It can be used by users to discover tasks or by admins to manage them.
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Task fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task fetched successfulle
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 665e88aa49c1b8a73c3f8701
 *                       title:
 *                         type: string
 *                         example: Follow us on Twitter
 *                       description:
 *                         type: string
 *                         example: Stay updated by following our official Twitter account.
 *                       link:
 *                         type: string
 *                         format: uri
 *                         example: https://twitter.com/ourproject
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *       500:
 *         description: Internal server error while fetching tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: Unexpected token in JSON
 */
router.get('/', taskController.getAllTasks);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieve a specific task by its unique ID.
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the task to retrieve.
 *         schema:
 *           type: string
 *           example: 60f7d3f8b30b5c001c8e4a5b
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60f7d3f8b30b5c001c8e4a5b
 *                     title:
 *                       type: string
 *                       example: complete onboarding
 *                     description:
 *                       type: string
 *                       example: User must complete the onboarding process
 *                     link:
 *                       type: string
 *                       example: https://example.com/onboarding
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task not found
 *       500:
 *         description: Server error while retrieving task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: Something went wrong
 */
router.get('/:id', taskController.getTaskById);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update an existing task
 *     description: >
 *       Update a task by its ID with the provided fields.
 *       <br><br>
 *       Only the fields included in the request body will be updated.
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the task to update.
 *         schema:
 *           type: string
 *           example: 60f7d3f8b30b5c001c8e4a5b
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Update profile
 *               description:
 *                 type: string
 *                 example: User must update their profile information
 *               link:
 *                 type: string
 *                 example: https://example.com/profile
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task updated successfully
 *                 task:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60f7d3f8b30b5c001c8e4a5b
 *                     title:
 *                       type: string
 *                       example: Update profile
 *                     description:
 *                       type: string
 *                       example: User must update their profile information
 *                     link:
 *                       type: string
 *                       example: https://example.com/profile
 *                     isActive:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task not found
 *       500:
 *         description: Server error during task update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: Something went wrong
 */
router.put('/:id', taskController.updateTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task by ID
 *     description: Permanently deletes a task from the system using its ID.
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the task to delete.
 *         schema:
 *           type: string
 *           example: 60f7d3f8b30b5c001c8e4a5b
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task deleted successfully
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task not found
 *       500:
 *         description: Server error during task deletion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: Something went wrong
 */
router.delete('/:id', taskController.deleteTask);

module.exports = router;
