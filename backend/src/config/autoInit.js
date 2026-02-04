import pool from './database.js';
import bcrypt from 'bcrypt';
import { generateKeyPair, encryptPrivateKey } from '../utils/cryptoUtils.js';

/**
 * Auto-initialize database on server startup (for free tier without Shell access)
 * Only runs if tables don't exist
 */
export async function autoInitDatabase() {
    try {
        // Check if users table exists and has data
        const checkResult = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            ) as table_exists
        `);

        if (!checkResult.rows[0].table_exists) {
            console.log('📦 First run detected - initializing database...');
            await createTables();
            await seedData();
            console.log('✅ Database auto-initialized successfully!');
        } else {
            // Check if we have any users
            const userCount = await pool.query('SELECT COUNT(*) FROM users');
            if (parseInt(userCount.rows[0].count) === 0) {
                console.log('📦 Empty database detected - seeding data...');
                await seedData();
                console.log('✅ Database seeded successfully!');
            } else {
                console.log('✅ Database already initialized');
            }
        }
    } catch (error) {
        console.error('⚠️ Auto-init check failed:', error.message);
        // Don't throw - let server continue even if init fails
    }

    // ALWAYS run schema migration (safely idempotently) to catch up existing databases
    try {
        console.log('🔄 Checking for schema updates...');
        await pool.query(`
            ALTER TABLE research_data ADD COLUMN IF NOT EXISTS original_hash VARCHAR(64);
            ALTER TABLE research_data ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified';
            ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS details JSONB;
        `);
        console.log('✅ Schema migration checked/applied');
    } catch (migError) {
        console.error('⚠️ Schema migration warning:', migError.message);
    }
}

async function createTables() {
    const schema = `
        -- Users Table
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'researcher', 'auditor')),
            public_key TEXT,
            encrypted_private_key TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- OTP Sessions Table
        CREATE TABLE IF NOT EXISTS otp_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            otp_code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Projects Table
        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Project Assignments Table
        CREATE TABLE IF NOT EXISTS project_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            assigned_role VARCHAR(50) NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(project_id, user_id)
        );

        -- Research Data Table
        CREATE TABLE IF NOT EXISTS research_data (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            researcher_id UUID REFERENCES users(id),
            title VARCHAR(500) NOT NULL,
            description TEXT,
            encrypted_content TEXT NOT NULL,
            iv TEXT NOT NULL,
            auth_tag TEXT NOT NULL,
            encrypted_aes_key TEXT NOT NULL,
            original_content TEXT,
            original_hash VARCHAR(64),
            status VARCHAR(50) DEFAULT 'pending',
            verification_status VARCHAR(50) DEFAULT 'unverified',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Audit Log Table
        CREATE TABLE IF NOT EXISTS audit_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            data_id UUID REFERENCES research_data(id) ON DELETE CASCADE,
            auditor_id UUID REFERENCES users(id),
            action VARCHAR(100) NOT NULL,
            result VARCHAR(50),
            details JSONB,
            performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_research_data_project ON research_data(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_assignments_user ON project_assignments(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_log_data ON audit_log(data_id);
    `;

    await pool.query(schema);
}

async function seedData() {
    const pass = 'Prithiv@123';
    const hash = await bcrypt.hash(pass, 10);
    const { publicKey, privateKey } = generateKeyPair();
    const encPriv = encryptPrivateKey(privateKey, pass);

    // 1. Create Admin
    const adminRes = await pool.query(
        `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        ['real', 'real@gmail.com', hash, 'admin', publicKey, encPriv]
    );

    let adminId;
    if (adminRes.rows.length > 0) {
        adminId = adminRes.rows[0].id;
    } else {
        const existing = await pool.query(`SELECT id FROM users WHERE email = 'real@gmail.com'`);
        adminId = existing.rows[0]?.id;
    }

    // 2. Create 3 Auditors
    const auditorIds = [];
    for (let i = 1; i <= 3; i++) {
        const res = await pool.query(
            `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (email) DO NOTHING
             RETURNING id`,
            [`auditor_${i}`, `auditor${i}@example.com`, hash, 'auditor', publicKey, encPriv]
        );
        if (res.rows.length > 0) {
            auditorIds.push(res.rows[0].id);
        } else {
            const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [`auditor${i}@example.com`]);
            if (existing.rows[0]) auditorIds.push(existing.rows[0].id);
        }
    }

    // 3. Create 10 Researchers
    const researcherIds = [];
    for (let i = 1; i <= 10; i++) {
        const res = await pool.query(
            `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (email) DO NOTHING
             RETURNING id`,
            [`researcher_${i}`, `researcher${i}@example.com`, hash, 'researcher', publicKey, encPriv]
        );
        if (res.rows.length > 0) {
            researcherIds.push(res.rows[0].id);
        } else {
            const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [`researcher${i}@example.com`]);
            if (existing.rows[0]) researcherIds.push(existing.rows[0].id);
        }
    }

    // 4. Create 3 Projects (only if admin exists)
    if (adminId) {
        const projects = [
            { name: 'Oncology Data V3', desc: 'Secure research into cancer biomarkers' },
            { name: 'Quantum Cryptography', desc: 'Experimental results for next-gen encryption' },
            { name: 'Genomic Integrity', desc: 'Tracking modifications in CRISPR sequence data' }
        ];

        for (let i = 0; i < projects.length; i++) {
            const p = projects[i];
            const pRes = await pool.query(
                `INSERT INTO projects (name, description, created_by) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT DO NOTHING
                 RETURNING id`,
                [p.name, p.desc, adminId]
            );

            if (pRes.rows.length > 0) {
                const pid = pRes.rows[0].id;

                // Assign 1 auditor
                if (auditorIds[i % 3]) {
                    await pool.query(
                        `INSERT INTO project_assignments (project_id, user_id, assigned_role) 
                         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                        [pid, auditorIds[i % 3], 'auditor']
                    );
                }

                // Assign 3 researchers
                for (let j = 0; j < 3; j++) {
                    const rid = researcherIds[(i * 3 + j) % 10];
                    if (rid) {
                        await pool.query(
                            `INSERT INTO project_assignments (project_id, user_id, assigned_role) 
                             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
                            [pid, rid, 'researcher']
                        );
                    }
                }
            }
        }
    }

    console.log('📊 Seeded: 1 Admin, 10 Researchers, 3 Auditors, 3 Projects');
}
