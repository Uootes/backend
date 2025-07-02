const express = require('express');
const router = express.Router();
const userTaskProgressController = require('../controllers/userTaskProgress');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/taskprogresses:
 *   post:
 *     summary: Access or initialize a user's task progress
 *     description: >
 *       This endpoint retrieves the current user's task progress if it exists.  
 *       If no progress is found, it initializes a new task progress document using all active tasks.  
 *       <br><br>
 *       **Behavior Details:**  
 *       - If progress exists: returns current progress  
 *       - If no progress exists: fetches all active tasks, creates progress entries, and returns them  
 *       - If no active tasks exist: returns an error  
 *       
 *       Each task includes: title, description, and link. Status starts as `start`.
 *     tags: [Task Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Existing task progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User task progress retrieved successfully.
 *                 data:
 *                   type: object
 *                   example:
 *                     userId: "60f7d2c3c4b2b243ac0a1d2a"
 *                     userName: "John Doe"
 *                     tasks:
 *                       - taskId:
 *                           _id: "60f7d3a7c4b2b243ac0a1d2c"
 *                           title: "Complete onboarding"
 *                           description: "Go through the onboarding material"
 *                           link: "https://example.com/onboarding"
 *                         status: "start"
 *                     completedCount: 2
 *                     rewardClaimed: false
 *       201:
 *         description: Task progress initialized and returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task progress started and retrieved.
 *                 data:
 *                   type: object
 *                   example:
 *                     userId: "60f7d2c3c4b2b243ac0a1d2a"
 *                     userName: "Jane Doe"
 *                     tasks:
 *                       - taskId:
 *                           _id: "60f7d3a7c4b2b243ac0a1d2c"
 *                           title: "Join community"
 *                           description: "Become part of the Discord server"
 *                           link: "https://discord.gg/uootech"
 *                         status: "start"
 *                     completedCount: 0
 *                     rewardClaimed: false
 *       404:
 *         description: User not found or no active tasks available
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: User not found.
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: No active tasks available to start.
 *       500:
 *         description: Server error when accessing task progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error accessing task progress.
 *                 error:
 *                   type: string
 *                   example: An unexpected error occurred.
 */
router.post('/', auth, userTaskProgressController.accessUserTaskProgress );

/**
 * @swagger
 * /api/v1/taskprogresses/{taskId}:
 *   patch:
 *     summary: Mark a task as completed for the authenticated user
 *     description: >
 *       This endpoint marks a specific task as completed (`status: done`) for the authenticated user.  
 *       <br><br>
 *       **Behavior Details:**  
 *       - Increments the completed task count  
 *       - Ignores if task was already marked as completed  
 *       - Fails if task is not found in the user's progress list  
 *       
 *       A user must have an existing task progress document to update.
 *     tags: [Task Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to mark as completed
 *     responses:
 *       200:
 *         description: Task successfully marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task marked as completed.
 *                 data:
 *                   type: object
 *                   example:
 *                     userId: "60f7d2c3c4b2b243ac0a1d2a"
 *                     tasks:
 *                       - taskId: "60f7d3a7c4b2b243ac0a1d2c"
 *                         status: "done"
 *                     completedCount: 3
 *                     rewardClaimed: false
 *       400:
 *         description: Task already marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task already completed.
 *       404:
 *         description: Task or user progress not found
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: User progress not found.
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Task not found in progress list.
 *       500:
 *         description: Server error while updating task status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error updating task.
 *                 error:
 *                   type: string
 *                   example: Unexpected error occurred
 */
router.patch('/:taskId', auth, userTaskProgressController.updateTaskStatus);

/**
 * @swagger
 * /api/v1/taskprogresses/progress:
 *   get:
 *     summary: Retrieve the task progress of the authenticated user
 *     description: >
 *       This endpoint retrieves the task progress document for the currently authenticated user.  
 *       Each task includes its associated `taskId` details via population (title, description, link, etc.).  
 *       <br><br>
 *       If no progress document is found, a 404 is returned.
 *     tags: [Task Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   example:
 *                     userId: "60f7d2c3c4b2b243ac0a1d2a"
 *                     userName: "John Doe"
 *                     tasks:
 *                       - taskId:
 *                           _id: "60f7d3a7c4b2b243ac0a1d2c"
 *                           title: "Complete onboarding"
 *                           description: "Intro material"
 *                           link: "https://example.com/onboarding"
 *                         status: "done"
 *                     completedCount: 3
 *                     rewardClaimed: false
 *       404:
 *         description: No progress found for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No progress found.
 *       500:
 *         description: Server error while fetching progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching progress.
 *                 error:
 *                   type: string
 *                   example: Unexpected error occurred
 */
router.get("/progress", auth, userTaskProgressController.getUserTaskProgress);

/**
 * @swagger
 * /api/v1/taskprogresses:
 *   get:
 *     summary: Get user's completed task count out of total active tasks
 *     description: >
 *       This endpoint returns a progress summary in the format `completed/total`,  
 *       showing how many tasks the authenticated user has completed out of all currently active tasks.
 *     tags: [Task Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 progress:
 *                   type: string
 *                   example: 3/5
 *       404:
 *         description: No progress document found for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User progress not found.
 *       500:
 *         description: Server error while retrieving progress count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error retrieving progress.
 *                 error:
 *                   type: string
 *                   example: Unexpected error occurred
 */
router.get('/',auth,  userTaskProgressController.getUserProgressCount);

module.exports = router