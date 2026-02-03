import express from 'express';
import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import { generateKeyPair, encryptPrivateKey } from '../utils/cryptoUtils.js';

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

/**
 * Force seed database - call once to populate demo data
 * GET /api/health/seed
 */
router.get('/seed', async (req, res) => {
    try {
        // Check if already seeded
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCount.rows[0].count) > 0) {
            return res.json({
                status: 'already_seeded',
                message: 'Database already has users',
                userCount: parseInt(userCount.rows[0].count)
            });
        }

        // Seed the database
        const pass = 'Prithiv@123';
        const hash = await bcrypt.hash(pass, 10);
        const { publicKey, privateKey } = generateKeyPair();
        const encPriv = encryptPrivateKey(privateKey, pass);

        // Create Admin
        const adminRes = await pool.query(
            `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            ['real', 'real@gmail.com', hash, 'admin', publicKey, encPriv]
        );
        const adminId = adminRes.rows[0].id;

        // Create 3 Auditors
        for (let i = 1; i <= 3; i++) {
            await pool.query(
                `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [`auditor_${i}`, `auditor${i}@example.com`, hash, 'auditor', publicKey, encPriv]
            );
        }

        // Create 10 Researchers
        for (let i = 1; i <= 10; i++) {
            await pool.query(
                `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [`researcher_${i}`, `researcher${i}@example.com`, hash, 'researcher', publicKey, encPriv]
            );
        }

        // Create 3 Projects
        const projects = [
            { name: 'Oncology Data V3', desc: 'Secure research into cancer biomarkers' },
            { name: 'Quantum Cryptography', desc: 'Experimental results for next-gen encryption' },
            { name: 'Genomic Integrity', desc: 'Tracking modifications in CRISPR sequence data' }
        ];

        for (const p of projects) {
            await pool.query(
                `INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3)`,
                [p.name, p.desc, adminId]
            );
        }

        res.json({
            status: 'seeded',
            message: 'Database seeded successfully!',
            users: { admin: 1, auditors: 3, researchers: 10 },
            projects: 3
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

export default router;
