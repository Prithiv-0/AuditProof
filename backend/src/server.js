import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===========================================
// MIDDLEWARE
// ===========================================

// Enable CORS for frontend
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3001',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
});

// ===========================================
// ROUTES
// ===========================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'VeriSchol API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Research data routes
app.use('/api/data', dataRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Project routes
app.use('/api/projects', projectRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'VeriSchol API',
        description: 'Secure Research Data Integrity System',
        version: '1.0.0',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register new user',
                'POST /api/auth/login': 'Login (returns OTP)',
                'POST /api/auth/verify-otp': 'Complete MFA login',
                'GET /api/auth/me': 'Get current user profile'
            },
            data: {
                'POST /api/data/upload': 'Upload research data (Researcher)',
                'GET /api/data': 'List research data',
                'GET /api/data/:id': 'Get specific research data',
                'POST /api/data/:id/verify': 'Verify data integrity (Auditor)',
                'GET /api/data/:id/qr': 'Generate QR code for verification'
            },
            admin: {
                'GET /api/admin/users': 'List all users',
                'POST /api/admin/users': 'Create new user',
                'PATCH /api/admin/users/:id/role': 'Update user role',
                'DELETE /api/admin/users/:id': 'Delete user',
                'GET /api/admin/stats': 'System statistics',
                'GET /api/admin/audit-logs': 'View audit logs'
            }
        },
        security: {
            authentication: 'Multi-Factor (Password + OTP)',
            authorization: 'Role-Based Access Control',
            encryption: 'AES-256-GCM with RSA Key Exchange',
            hashing: 'SHA-256 with Salt',
            signatures: 'RSA Digital Signatures'
        }
    });
});

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error(err.stack);

    res.status(err.status || 500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// ===========================================
// START SERVER
// ===========================================

app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('🔐 VeriSchol API Server');
    console.log('========================================');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`📋 API Docs: http://localhost:${PORT}/api`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log('========================================');
    console.log('🛡️  Security Features:');
    console.log('   • Multi-Factor Authentication (MFA)');
    console.log('   • Role-Based Access Control');
    console.log('   • AES-256-GCM Encryption');
    console.log('   • RSA-2048 Key Exchange');
    console.log('   • SHA-256 Integrity Hashing');
    console.log('   • Digital Signatures');
    console.log('========================================\n');
});

export default app;
