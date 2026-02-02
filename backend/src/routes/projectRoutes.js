import express from 'express';
import {
    getMyProjects,
    getProjectDetails,
    createProject,
    assignUser
} from '../controllers/projectController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All project routes require authentication
router.use(verifyToken);

// Get my projects
router.get('/', getMyProjects);

// Get project details
router.get('/:id', getProjectDetails);

// Create project (Admin only)
router.post('/', authorize('projects', 'create'), createProject);

// Assign user to project (Admin only)
router.post('/assign', authorize('projects', 'assign'), assignUser);

export default router;
