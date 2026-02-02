import express from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUserRole,
    deleteUser,
    getSystemStats,
    getAuditLogs
} from '../controllers/adminController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * Admin Routes
 * Base path: /api/admin
 * All routes require authentication and admin role
 */

// User management
router.get('/users',
    verifyToken,
    authorize('system_settings', 'read'),
    getAllUsers
);

router.get('/users/:id',
    verifyToken,
    authorize('system_settings', 'read'),
    getUserById
);

router.post('/users',
    verifyToken,
    authorize('system_settings', 'create'),
    createUser
);

router.patch('/users/:id/role',
    verifyToken,
    authorize('system_settings', 'update'),
    updateUserRole
);

router.delete('/users/:id',
    verifyToken,
    authorize('system_settings', 'delete'),
    deleteUser
);

// System statistics
router.get('/stats',
    verifyToken,
    authorize('system_settings', 'read'),
    getSystemStats
);

// Audit logs
router.get('/audit-logs',
    verifyToken,
    authorize('audit_log', 'read'),
    getAuditLogs
);

export default router;
