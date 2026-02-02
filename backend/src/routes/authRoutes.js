import express from 'express';
import { register, login, verifyOtp, getProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);

// Protected routes (require JWT)
router.get('/me', verifyToken, getProfile);

export default router;
