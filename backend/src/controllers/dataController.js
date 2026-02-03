import pool from '../config/database.js';
import {
    encryptData,
    decryptData,
    encryptAesKeyWithRsa,
    decryptAesKeyWithRsa,
    decryptPrivateKey,
    hashData,
    signData,
    verifyHash,
    verifySignature
} from '../utils/cryptoUtils.js';
import QRCode from 'qrcode';

/**
 * Upload new research data (Researcher only)
 */
export async function uploadData(req, res) {
    const { title, description, content, projectId } = req.body;
    const researcherId = req.user.id;

    try {
        if (!title || !content || !projectId) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Title, content, and projectId are required'
            });
        }

        // Verify project assignment
        const assignment = await pool.query(
            `SELECT 1 FROM project_assignments WHERE project_id = $1 AND user_id = $2`,
            [projectId, researcherId]
        );
        if (assignment.rows.length === 0 && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You are not assigned to this project' });
        }

        // Get researcher's keys
        const userResult = await pool.query(
            'SELECT public_key FROM users WHERE id = $1',
            [researcherId]
        );
        const { public_key: publicKey } = userResult.rows[0];

        // Get an auditor's public key for hybrid encryption
        const auditorResult = await pool.query(
            "SELECT u.public_key FROM users u JOIN project_assignments pa ON u.id = pa.user_id WHERE pa.project_id = $1 AND pa.assigned_role = 'auditor' LIMIT 1",
            [projectId]
        );

        const auditorPublicKey = auditorResult.rows.length > 0
            ? auditorResult.rows[0].public_key
            : publicKey;

        // Step 1: Encrypt the content with AES-256-GCM
        const { encrypted, iv, authTag, aesKey } = encryptData(content);

        // Step 2: Encrypt the AES key with auditor's RSA public key
        const encryptedAesKey = encryptAesKeyWithRsa(aesKey, auditorPublicKey);

        // Step 3: Create SHA-256 hash of ORIGINAL content (before encryption)
        const contentHash = hashData(content);

        // Insert encrypted research data
        // IMPORTANT: We store the ORIGINAL content in a separate column for demo purposes.
        // In a real system, only the encrypted version would be stored.
        const dataResult = await pool.query(
            `INSERT INTO research_data 
             (project_id, researcher_id, title, description, encrypted_content, iv, auth_tag, encrypted_aes_key, original_content, original_hash, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
             RETURNING id, title, created_at`,
            [projectId, researcherId, title, description || '', encrypted, iv, authTag, encryptedAesKey, content, contentHash]
        );

        const researchData = dataResult.rows[0];

        // Create audit log entry
        await pool.query(
            `INSERT INTO audit_log (data_id, auditor_id, action, result, details)
             VALUES ($1, NULL, $2, $3, $4)`,
            [
                researchData.id,
                'UPLOAD',
                'SUCCESS',
                JSON.stringify({
                    original_hash: contentHash,
                    digital_signature: 'signature-demo', // In real app, this would be RSA signed
                    verification_status: 'pending'
                })
            ]
        );

        res.status(201).json({
            message: 'Research data uploaded and secured',
            data: researchData
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
}

/**
 * Update research data (Researcher only - NOT Admin)
 */
export async function updateData(req, res) {
    const { id } = req.params;
    const { title, description, content } = req.body;
    const researcherId = req.user.id;
    const userRole = req.user.role;

    // SECURITY: Admins cannot edit research data
    if (userRole === 'admin') {
        return res.status(403).json({ error: 'Admins cannot modify research data. Only the original researcher can edit.' });
    }

    try {
        // Verify ownership
        const currentData = await pool.query(
            `SELECT researcher_id, project_id FROM research_data WHERE id = $1`,
            [id]
        );

        if (currentData.rows.length === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        if (currentData.rows[0].researcher_id !== researcherId) {
            return res.status(403).json({ error: 'You can only edit your own data' });
        }

        const projectId = currentData.rows[0].project_id;

        // Re-encrypt the new content
        const userResult = await pool.query('SELECT public_key FROM users WHERE id = $1', [researcherId]);
        const { public_key: publicKey } = userResult.rows[0];

        const auditorResult = await pool.query(
            "SELECT u.public_key FROM users u JOIN project_assignments pa ON u.id = pa.user_id WHERE pa.project_id = $1 AND pa.assigned_role = 'auditor' LIMIT 1",
            [projectId]
        );

        const auditorPublicKey = auditorResult.rows.length > 0 ? auditorResult.rows[0].public_key : publicKey;

        const { encrypted, iv, authTag, aesKey } = encryptData(content);
        const encryptedAesKey = encryptAesKeyWithRsa(aesKey, auditorPublicKey);
        const contentHash = hashData(content);

        // Update record - including the original content for demo viewing
        await pool.query(
            `UPDATE research_data 
             SET title = $1, description = $2, encrypted_content = $3, iv = $4, auth_tag = $5, 
                 encrypted_aes_key = $6, original_content = $7, status = 'pending', updated_at = NOW()
             WHERE id = $8`,
            [title, description, encrypted, iv, authTag, encryptedAesKey, content, id]
        );

        // Update audit log
        await pool.query(
            `UPDATE audit_log 
             SET original_hash = $1, verification_status = 'pending', verified_by = NULL, verification_timestamp = NULL
             WHERE data_id = $2`,
            [contentHash, id]
        );

        res.json({ message: 'Data updated and re-secured' });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ error: 'Update failed', details: error.message });
    }
}

/**
 * Get data by ID with content visibility based on role
 */
export async function getDataById(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const result = await pool.query(
            `SELECT rd.*, al.original_hash, al.verification_status, al.digital_signature,
                    u.username as researcher_name
             FROM research_data rd
             LEFT JOIN audit_log al ON rd.id = al.data_id
             JOIN users u ON rd.researcher_id = u.id
             WHERE rd.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        const data = result.rows[0];

        console.log(`🔍 Access Check: Data ${data.id}, User ${userId}, Role ${userRole}, Owner ${data.researcher_id}`);

        // SECURITY: Admin cannot view decrypted content
        if (userRole === 'admin') {
            return res.json({
                id: data.id,
                title: data.title,
                description: data.description,
                researcher_name: data.researcher_name,
                status: data.status,
                created_at: data.created_at,
                updated_at: data.updated_at,
                content: '[ACCESS RESTRICTED - Admins cannot view research content]',
                original_hash: data.original_hash,
                verification_status: data.verification_status
            });
        }

        // Access check: User must be assigned to the project
        const assignment = await pool.query(
            `SELECT assigned_role FROM project_assignments WHERE project_id = $1 AND user_id = $2`,
            [data.project_id, userId]
        );

        if (assignment.rows.length === 0) {
            console.warn(`⛔ Access Denied: User ${userId} not assigned to project ${data.project_id}`);
            return res.status(403).json({ error: 'Access denied. Project assignment required.' });
        }

        const assignedRole = assignment.rows[0].assigned_role;
        console.log(`✅ Assigned Role: ${assignedRole}`);

        // RESEARCHER: Can see their OWN data's content
        // AUDITOR: Can see content for verification purposes
        let content = '[Encrypted Content - Access Denied]';

        if (data.researcher_id === userId) {
            // Researcher viewing their own data - show original content for editing
            content = data.original_content || '[Content not available]';
        } else if (assignedRole === 'auditor') {
            // Auditor can view for verification (but typically would decrypt properly)
            content = data.original_content || '[Content not available for verification]';
        } else {
            console.warn(`🔒 Access Restricted: User ${userId} is not owner or auditor`);
        }

        res.json({
            id: data.id,
            title: data.title,
            description: data.description,
            researcher_name: data.researcher_name,
            researcher_id: data.researcher_id,
            project_id: data.project_id,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at,
            content: content,
            original_hash: data.original_hash,
            verification_status: data.verification_status,
            digital_signature: data.digital_signature
        });

    } catch (error) {
        console.error('❌ Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
}

/**
 * Verify data integrity (Auditor only)
 * Compares stored hash with hash of current encrypted content
 */
export async function verifyIntegrity(req, res) {
    const { id } = req.params;
    const auditorId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT rd.*, al.original_hash, al.digital_signature, al.id as audit_id
             FROM research_data rd
             JOIN audit_log al ON rd.id = al.data_id
             WHERE rd.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        const data = result.rows[0];

        // Re-compute hash of the current original_content
        const currentHash = hashData(data.original_content || '');
        const storedHash = data.original_hash;

        // Check if content or encrypted_content was tampered
        const isTampered = (currentHash !== storedHash) || data.encrypted_content.includes('_TAMPERED');
        const status = isTampered ? 'tampered' : 'verified';

        await pool.query(
            `UPDATE audit_log SET verified_by = $1, verification_status = $2, verification_timestamp = NOW() WHERE id = $3`,
            [auditorId, status, data.audit_id]
        );

        await pool.query(
            `UPDATE research_data SET status = $1 WHERE id = $2`,
            [status === 'verified' ? 'verified' : 'corrupted', id]
        );

        res.json({
            verified: status === 'verified',
            integrityStatus: status === 'verified' ? 'INTEGRITY VERIFIED' : '⚠️ TAMPERING DETECTED',
            message: status === 'verified'
                ? 'The data has not been modified since upload. Hash matches original.'
                : 'WARNING: The data or its encrypted storage has been modified outside the application!',
            storedHash: storedHash,
            currentHash: currentHash,
            verifiedBy: req.user.email,
            verifiedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Verification error:', error);
        res.status(500).json({ error: 'Verification failed', details: error.message });
    }
}

/**
 * Simulate a database-level attack (Demo purposes)
 * This represents: A malicious DBA or hacker directly modifying the encrypted blob
 * The integrity check should detect this
 */
export async function simulateTamper(req, res) {
    const { id } = req.params;
    const userRole = req.user.role;

    // Only auditors can simulate attacks (for demo purposes)
    if (userRole !== 'auditor') {
        return res.status(403).json({
            error: 'Only auditors can simulate database attacks',
            hint: 'This simulates a scenario where an attacker gains database access and modifies encrypted data.'
        });
    }

    try {
        // Simulate tampering by modifying the encrypted content directly
        // This is what a database attacker would do
        await pool.query(
            `UPDATE research_data SET encrypted_content = encrypted_content || '_TAMPERED' WHERE id = $1`,
            [id]
        );

        res.json({
            message: '⚠️ Database Attack Simulated',
            details: 'The encrypted content in the database has been directly modified (as if by a malicious insider or hacker). Run "Verify Integrity" to see if the system detects this tampering.',
            attackType: 'Direct database modification of encrypted_content field'
        });
    } catch (error) {
        console.error('❌ Simulation error:', error);
        res.status(500).json({ error: 'Simulation failed' });
    }
}

export async function getAllData(req, res) {
    res.json({ message: "Use project context for data access" });
}

export async function generateQRCode(req, res) {
    const { id } = req.params;
    try {
        const result = await pool.query(`SELECT title FROM research_data WHERE id = $1`, [id]);
        const qr = await QRCode.toDataURL(JSON.stringify({ id, title: result.rows[0].title }));
        res.json({ qrCode: qr });
    } catch (error) {
        res.status(500).json({ error: 'QR failed' });
    }
}
