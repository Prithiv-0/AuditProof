import pool from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { generateKeyPair, encryptPrivateKey } from '../utils/cryptoUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
    console.log('🚀 Initializing VeriSchol Enterprise Database (Scaled for 10+ Researchers)...');

    try {
        const schemaPath = path.join(__dirname, '../models/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);

        console.log('✅ Schema Applied.');

        // 1. Create Head Admin
        const pass = 'Prithiv@123';
        const hash = await bcrypt.hash(pass, 10);
        const { publicKey, privateKey } = generateKeyPair();
        const encPriv = encryptPrivateKey(privateKey, pass);

        const adminRes = await pool.query(
            `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            ['real', 'real@gmail.com', hash, 'admin', publicKey, encPriv]
        );
        const adminId = adminRes.rows[0].id;

        // 2. Create 3 Auditors
        const auditorIds = [];
        for (let i = 1; i <= 3; i++) {
            const auditorRes = await pool.query(
                `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [`auditor_${i}`, `auditor${i}@example.com`, hash, 'auditor', publicKey, encPriv]
            );
            auditorIds.push(auditorRes.rows[0].id);
        }

        // 3. Create 10 Researchers
        const researcherIds = [];
        for (let i = 1; i <= 10; i++) {
            const resRes = await pool.query(
                `INSERT INTO users (username, email, password_hash, role, public_key, encrypted_private_key)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [`researcher_${i}`, `researcher${i}@example.com`, hash, 'researcher', publicKey, encPriv]
            );
            researcherIds.push(resRes.rows[0].id);
        }

        // 4. Create 3 Projects
        const projects = [
            { name: 'Oncology Data V3', desc: 'Secure research into cancer biomarkers' },
            { name: 'Quantum Cryptography', desc: 'Experimental results for next-gen encryption' },
            { name: 'Genomic Integrity', desc: 'Tracking modifications in CRISPR sequence data' }
        ];

        for (let i = 0; i < projects.length; i++) {
            const p = projects[i];
            const pRes = await pool.query(
                `INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING id`,
                [p.name, p.desc, adminId]
            );
            const pid = pRes.rows[0].id;

            // Assign 1 auditor to this project
            await pool.query(
                `INSERT INTO project_assignments (project_id, user_id, assigned_role) VALUES ($1, $2, $3)`,
                [pid, auditorIds[i % 3], 'auditor']
            );

            // Assign 3 researchers to this project
            for (let j = 0; j < 3; j++) {
                const rid = researcherIds[(i * 3 + j) % 10];
                await pool.query(
                    `INSERT INTO project_assignments (project_id, user_id, assigned_role) VALUES ($1, $2, $3)`,
                    [pid, rid, 'researcher']
                );
            }
        }

        console.log('✅ Scaled Environment Seeded (Admin, 10 Researchers, 3 Auditors, 3 Projects).');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

initDatabase();
