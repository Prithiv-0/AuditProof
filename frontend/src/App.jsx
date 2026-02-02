import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import ProjectDetail from './pages/ProjectDetail';

// Protected route wrapper
function ProtectedRoute({ children, adminOnly = false }) {
    const { isAuthenticated, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner w-8 h-8"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

// Public route wrapper (redirect if logged in)
function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner w-8 h-8"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={
                <PublicRoute><Login /></PublicRoute>
            } />
            <Route path="/register" element={
                <PublicRoute><Register /></PublicRoute>
            } />

            {/* Protected routes */}
            <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/project/:id" element={
                <ProtectedRoute><ProjectDetail /></ProtectedRoute>
            } />
            <Route path="/admin" element={
                <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
