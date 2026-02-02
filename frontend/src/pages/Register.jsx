import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'researcher'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validatePassword = (password) => {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        return checks;
    };

    const checks = validatePassword(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authAPI.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-8 text-center animate-fadeIn">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Registration Successful!</h2>
                    <p className="text-zinc-400">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="glass-card w-full max-w-md p-8 animate-fadeIn relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create Account</h1>
                    <p className="text-zinc-400 mt-1">Join VeriSchol</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="input-label">Username</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="johndoe"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="input-label">Email</label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="you@university.edu"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="input-label">Role</label>
                            <select
                                className="input-field"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="researcher">Researcher</option>
                                <option value="auditor">Auditor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="input-label">Password</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />

                            {/* Password requirements */}
                            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                                <div className={`flex items-center gap-1 ${checks.length ? 'text-green-400' : 'text-zinc-500'}`}>
                                    <span>{checks.length ? '✓' : '○'}</span> 8+ characters
                                </div>
                                <div className={`flex items-center gap-1 ${checks.uppercase ? 'text-green-400' : 'text-zinc-500'}`}>
                                    <span>{checks.uppercase ? '✓' : '○'}</span> Uppercase
                                </div>
                                <div className={`flex items-center gap-1 ${checks.lowercase ? 'text-green-400' : 'text-zinc-500'}`}>
                                    <span>{checks.lowercase ? '✓' : '○'}</span> Lowercase
                                </div>
                                <div className={`flex items-center gap-1 ${checks.number ? 'text-green-400' : 'text-zinc-500'}`}>
                                    <span>{checks.number ? '✓' : '○'}</span> Number
                                </div>
                                <div className={`flex items-center gap-1 ${checks.special ? 'text-green-400' : 'text-zinc-500'}`}>
                                    <span>{checks.special ? '✓' : '○'}</span> Special char
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Confirm Password</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !Object.values(checks).every(Boolean)}
                        className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="spinner"></div> : 'Create Account'}
                    </button>

                    <p className="text-center mt-6 text-zinc-400 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300">
                            Sign in
                        </Link>
                    </p>
                </form>

                {/* Security note */}
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-zinc-500 text-xs">
                    <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm3 7V7a3 3 0 10-6 0v2h6z" />
                    </svg>
                    RSA key pair will be generated for your account
                </div>
            </div>
        </div>
    );
}
