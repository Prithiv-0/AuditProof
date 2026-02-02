import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Verify JWT token middleware
 * Extracts token from Authorization header and validates it
 */
export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Access denied',
            message: 'No token provided or invalid format. Use: Bearer <token>'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.userId,
            role: decoded.role,
            email: decoded.email
        };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Please login again'
            });
        }
        return res.status(403).json({
            error: 'Invalid token',
            message: 'Token verification failed'
        });
    }
}

/**
 * Generate JWT token
 * @param {Object} payload - Token payload (userId, role, email)
 * @returns {string} JWT token
 */
export function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
}
