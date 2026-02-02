/**
 * Role-Based Access Control Middleware
 * Implements the Access Control Matrix for VeriSchol
 */

const accessMatrix = {
    researcher: {
        projects: ['read'],
        research_data: ['create', 'read', 'update', 'delete'],
        audit_log: [],
        system_settings: []
    },
    auditor: {
        projects: ['read'],
        research_data: ['read', 'verify'],
        audit_log: ['read'],
        system_settings: []
    },
    admin: {
        projects: ['read', 'create', 'update', 'delete', 'assign'],
        research_data: ['read', 'delete'],
        audit_log: ['read'],
        system_settings: ['read', 'create', 'update', 'delete', 'full']
    }
};

/**
 * Authorization middleware factory
 * @param {string} resource - The resource being accessed
 * @param {string} action - The action being performed
 * @returns {Function} Express middleware function
 */
export function authorize(resource, action) {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
        }

        const userRole = req.user.role.toLowerCase();

        // Super Admin Bypass for System Settings
        if (userRole === 'admin' && resource === 'system_settings') {
            return next();
        }

        const permissions = accessMatrix[userRole]?.[resource] || [];

        // Check if user has permission for the action
        if (!permissions.includes(action)) {
            console.log(`🚫 Access denied: ${userRole} cannot ${action} on ${resource}`);
            return res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. ${userRole} role cannot perform ${action} on ${resource}`
            });
        }

        console.log(`✅ Access granted: ${userRole} performing ${action} on ${resource}`);
        next();
    };
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role, resource, action) {
    const permissions = accessMatrix[role?.toLowerCase()]?.[resource] || [];
    return permissions.includes(action);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role) {
    return accessMatrix[role?.toLowerCase()] || {};
}
