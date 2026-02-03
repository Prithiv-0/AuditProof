
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function diagnose() {
    try {
        console.log('🔍 Diagnosing Research Data...');
        const res = await pool.query(`
            SELECT rd.id, rd.title, rd.status, rd.original_hash as rd_hash, 
                   al.id as audit_id, al.details 
            FROM research_data rd
            LEFT JOIN audit_log al ON rd.id = al.data_id
        `);

        console.table(res.rows.map(r => ({
            title: r.title.substring(0, 20),
            id: r.id,
            rd_hash: r.rd_hash ? r.rd_hash.substring(0, 10) + '...' : 'NULL',
            audit_id: r.audit_id,
            details: r.details ? JSON.stringify(r.details).substring(0, 30) + '...' : 'NULL'
        })));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

diagnose();
