import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import { generateKeyPair, encryptPrivateKey } from '../utils/cryptoUtils.js';

const SALT_ROUNDS = 10;

/**
 * Get all users (Admin only)
 * GET /api/admin/users
 */
export async function getAllUsers(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, username, email, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
        );

        res.json({
            count: result.rows.length,
            users: result.rows
        });

    } catch (error) {
        console.error('❌ Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}

/**
 * Get user by ID (Admin only)
 * GET /api/admin/users/:id
 */
export async function getUserById(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, username, email, role, created_at, updated_at
       FROM users WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });

    } catch (error) {
        console.error('❌ Fetch user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
}

/**
 * Create new user (Admin only)
 * POST /api/admin/users
 */
export async function createUser(req, res) {
    const { username, email, password, role } = req.body;

    try {
        if (!username || !email || !password || !role) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Username, email, password, and role are required'
            });
        }

        const validRoles = ['researcher', 'auditor', 'admin'];
        if (!validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                error: 'Invalid role',
                message: `Valid roles: ${validRoles.join(', ')}`
            });
        }

        // Check if user exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email.toLowerCase(), username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const { publicKey, privateKey } = generateKeyPair();
        const encryptedPrivateKey = encryptPrivateKey(privateKey, password);

        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role, created_at`,
            [username, email.toLowerCase(), passwordHash, role.toLowerCase(), publicKey, encryptedPrivateKey]
        );

        console.log(`👤 User created by admin: ${result.rows[0].email}`);

        res.status(201).json({
            message: 'User created successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
}

/**
 * Update user role (Admin only)
 * PATCH /api/admin/users/:id/role
 */
export async function updateUserRole(req, res) {
    const { id } = req.params;
    const { role } = req.body;

    try {
        const validRoles = ['researcher', 'auditor', 'admin'];
        if (!validRoles.includes(role?.toLowerCase())) {
            return res.status(400).json({
                error: 'Invalid role',
                message: `Valid roles: ${validRoles.join(', ')}`
            });
        }

        const result = await pool.query(
            `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, role`,
            [role.toLowerCase(), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`🔄 Role updated for ${result.rows[0].email}: ${role}`);

        res.json({
            message: 'User role updated',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Update role error:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
}

/**
 * Delete user (Admin only)
 * DELETE /api/admin/users/:id
 */
export async function deleteUser(req, res) {
    const { id } = req.params;

    try {
        // Prevent self-deletion
        if (id === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username, email',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`🗑️ User deleted: ${result.rows[0].email}`);

        res.json({
            message: 'User deleted successfully',
            deletedUser: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
}

/**
 * Get system statistics (Admin only)
 * GET /api/admin/stats
 */
export async function getSystemStats(req, res) {
    try {
        const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'researcher') as researchers,
        (SELECT COUNT(*) FROM users WHERE role = 'auditor') as auditors,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as admins,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM research_data) as total_records,
        (SELECT COUNT(*) FROM research_data WHERE verification_status = 'verified') as verified_records,
        (SELECT COUNT(*) FROM research_data WHERE verification_status = 'tampered') as corrupted_records,
        (SELECT COUNT(*) FROM audit_log) as total_audits
    `);

        res.json({ stats: stats.rows[0] });

    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
}

/**
 * Get audit logs (Admin only)
 * GET /api/admin/audit-logs
 */
export async function getAuditLogs(req, res) {
    try {
        const result = await pool.query(`
      SELECT al.*, 
             rd.title as data_title,
             signer.username as signer_name,
             verifier.username as verified_by_name
      FROM audit_log al
      JOIN research_data rd ON al.data_id = rd.id
      JOIN users signer ON al.signer_id = signer.id
      LEFT JOIN users verifier ON al.verified_by = verifier.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);

        res.json({
            count: result.rows.length,
            logs: result.rows
        });

    } catch (error) {
        console.error('❌ Audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
}
