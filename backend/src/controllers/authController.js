import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { generateToken } from '../middleware/authMiddleware.js';
import {
    generateKeyPair,
    encryptPrivateKey,
    generateOTP
} from '../utils/cryptoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (!minLength) errors.push('Password must be at least 8 characters');
    if (!hasUppercase) errors.push('Password must contain uppercase letter');
    if (!hasLowercase) errors.push('Password must contain lowercase letter');
    if (!hasNumber) errors.push('Password must contain a number');
    if (!hasSpecial) errors.push('Password must contain a special character');

    return { valid: errors.length === 0, errors };
}

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req, res) {
    const { username, email, password, role = 'researcher' } = req.body;

    try {
        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Username, email, and password are required'
            });
        }

        // Validate role
        const validRoles = ['researcher', 'auditor', 'admin'];
        if (!validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                error: 'Validation failed',
                message: `Invalid role. Valid roles: ${validRoles.join(', ')}`
            });
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: 'Weak password',
                message: passwordValidation.errors.join('. ')
            });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email.toLowerCase(), username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'User exists',
                message: 'Email or username already registered'
            });
        }

        // Hash password with bcrypt
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Generate RSA key pair for the user
        const { publicKey, privateKey } = generateKeyPair();

        // Encrypt private key with user's password (for demo storage)
        const encryptedPrivateKey = encryptPrivateKey(privateKey, password);

        // Insert new user
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role, created_at`,
            [username, email.toLowerCase(), passwordHash, role.toLowerCase(), publicKey, encryptedPrivateKey]
        );

        const user = result.rows[0];

        console.log(`✅ User registered: ${user.email} (${user.role})`);

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'Internal server error'
        });
    }
}

/**
 * Login - Step 1: Verify password and generate OTP
 * POST /api/auth/login
 */
export async function login(req, res) {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const result = await pool.query(
            'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        // Verify password with bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid email or password'
            });
        }

        // Generate 6-digit OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Delete any existing OTP for this user
        await pool.query('DELETE FROM otp_sessions WHERE user_id = $1', [user.id]);

        // Store new OTP
        await pool.query(
            'INSERT INTO otp_sessions (user_id, otp_code, expires_at) VALUES ($1, $2, $3)',
            [user.id, otpCode, expiresAt]
        );

        console.log(`🔐 OTP generated for ${user.email}: ${otpCode} (valid for ${OTP_EXPIRY_MINUTES} minutes)`);

        // In production, send OTP via email/SMS
        // For demo, we return it in the response
        res.status(200).json({
            message: 'Password verified. Please enter the OTP to complete login.',
            userId: user.id,
            otpSentTo: user.email,
            expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
            // DEMO ONLY: Remove in production
            _demo_otp: otpCode
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'Internal server error'
        });
    }
}

/**
 * Verify OTP - Step 2: Complete MFA and issue JWT
 * POST /api/auth/verify-otp
 */
export async function verifyOtp(req, res) {
    const { userId, otp } = req.body;

    try {
        if (!userId || !otp) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'User ID and OTP are required'
            });
        }

        // Find valid OTP session
        const otpResult = await pool.query(
            `SELECT os.*, u.email, u.role, u.username 
       FROM otp_sessions os 
       JOIN users u ON os.user_id = u.id
       WHERE os.user_id = $1 AND os.otp_code = $2 AND os.used = FALSE AND os.expires_at > NOW()`,
            [userId, otp]
        );

        if (otpResult.rows.length === 0) {
            return res.status(401).json({
                error: 'OTP verification failed',
                message: 'Invalid or expired OTP'
            });
        }

        const session = otpResult.rows[0];

        // Mark OTP as used
        await pool.query(
            'UPDATE otp_sessions SET used = TRUE WHERE id = $1',
            [session.id]
        );

        // Generate JWT token
        const token = generateToken({
            userId: userId,
            email: session.email,
            role: session.role
        });

        console.log(`✅ MFA complete for ${session.email}`);

        res.status(200).json({
            message: 'Authentication successful',
            token,
            user: {
                id: userId,
                username: session.username,
                email: session.email,
                role: session.role
            }
        });

    } catch (error) {
        console.error('❌ OTP verification error:', error);
        res.status(500).json({
            error: 'Verification failed',
            message: 'Internal server error'
        });
    }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getProfile(req, res) {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({ user: result.rows[0] });

    } catch (error) {
        console.error('❌ Profile fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch profile'
        });
    }
}
