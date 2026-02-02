import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * Health check endpoint for deployment monitoring
 */
router.get('/', async (req, res) => {
    try {
        // Check database connection
        const dbResult = await pool.query('SELECT NOW() as time');

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            dbTime: dbResult.rows[0].time,
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

export default router;
