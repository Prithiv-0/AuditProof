import axios from 'axios';

// Use environment variable for API URL, fallback to relative path for proxy
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    verifyOtp: (data) => api.post('/auth/verify-otp', data),
    getProfile: () => api.get('/auth/me')
};

// Data API
export const dataAPI = {
    upload: (data) => api.post('/data/upload', data),
    update: (id, data) => api.put(`/data/${id}`, data),
    getAll: () => api.get('/data'),
    getById: (id) => api.get(`/data/${id}`),
    verify: (id) => api.post(`/data/${id}/verify`),
    getQR: (id) => api.get(`/data/${id}/qr`),
    simulateTamper: (id) => api.post(`/data/${id}/tamper`)
};

// Project API
export const projectAPI = {
    getAll: () => api.get('/projects'),
    getDetails: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    assignUser: (data) => api.post('/projects/assign', data)
};

// Admin API
export const adminAPI = {
    getUsers: () => api.get('/admin/users'),
    createUser: (data) => api.post('/admin/users', data),
    updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getStats: () => api.get('/admin/stats'),
    getAuditLogs: () => api.get('/admin/audit-logs')
};

export default api;
