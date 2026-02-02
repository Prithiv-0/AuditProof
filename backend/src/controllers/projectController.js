import pool from '../config/database.js';

/**
 * Get all projects current user is assigned to
 */
export const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role.toLowerCase();

        let query;
        let params = [];

        if (userRole === 'admin') {
            // Admin sees all projects
            query = `SELECT * FROM projects ORDER BY created_at DESC`;
        } else {
            // Researchers and Auditors see only assigned projects
            query = `
                SELECT p.*, pa.assigned_role 
                FROM projects p
                JOIN project_assignments pa ON p.id = pa.project_id
                WHERE pa.user_id = $1
                ORDER BY p.created_at DESC
            `;
            params = [userId];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Get a single project with its data
 */
export const getProjectDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role.toLowerCase();

        // Verify assignment (unless admin)
        if (userRole !== 'admin') {
            const assignment = await pool.query(
                `SELECT 1 FROM project_assignments WHERE project_id = $1 AND user_id = $2`,
                [id, userId]
            );
            if (assignment.rows.length === 0) {
                return res.status(403).json({ error: 'You are not assigned to this project' });
            }
        }

        const project = await pool.query(`SELECT * FROM projects WHERE id = $1`, [id]);
        if (project.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Fetch data for this project
        const data = await pool.query(
            `SELECT rd.id, rd.title, rd.description, rd.status, rd.created_at, rd.updated_at,
                    u.username as researcher_name
             FROM research_data rd
             JOIN users u ON rd.researcher_id = u.id
             WHERE rd.project_id = $1 
             ORDER BY rd.updated_at DESC`,
            [id]
        );

        res.json({
            ...project.rows[0],
            data: data.rows
        });
    } catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Create a new project (Admin only)
 */
export const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const result = await pool.query(
            `INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *`,
            [name, description || '', userId]
        );

        console.log(`🚀 Project created: ${result.rows[0].name} by Admin ${userId}`);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error creating project:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Assign user to project (Admin only)
 */
export const assignUser = async (req, res) => {
    try {
        const { projectId, userId, role } = req.body;

        if (!projectId || !userId) {
            return res.status(400).json({ error: 'Project ID and User ID are required' });
        }

        // Verify user existence and role
        const userResult = await pool.query(`SELECT role FROM users WHERE id = $1`, [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const assignedRole = role || userResult.rows[0].role;

        await pool.query(
            `INSERT INTO project_assignments (project_id, user_id, assigned_role)
             VALUES ($1, $2, $3)
             ON CONFLICT (project_id, user_id) DO UPDATE SET assigned_role = $3`,
            [projectId, userId, assignedRole]
        );

        res.json({ message: 'User assigned successfully' });
    } catch (error) {
        console.error('Error assigning user:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
