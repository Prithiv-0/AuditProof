import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState('credentials'); // credentials | otp
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [otpData, setOtpData] = useState({ userId: '', otp: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [demoOtp, setDemoOtp] = useState('');

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData);
            setOtpData(prev => ({ ...prev, userId: response.data.userId }));
            setDemoOtp(response.data._demo_otp);
            setStep('otp');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.verifyOtp(otpData);
            login(response.data.user, response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="glass-card w-full max-w-md p-8 animate-fadeIn relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">VeriSchol</h1>
                    <p className="text-zinc-400 mt-1">Secure Research Integrity</p>
                </div>

                {step === 'credentials' ? (
                    <form onSubmit={handleCredentialsSubmit}>
                        <h2 className="text-lg font-semibold text-white mb-6">Sign In</h2>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
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
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="spinner"></div> : 'Continue'}
                        </button>

                        <p className="text-center mt-6 text-zinc-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary-400 hover:text-primary-300">
                                Register
                            </Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit}>
                        <h2 className="text-lg font-semibold text-white mb-2">Two-Factor Authentication</h2>
                        <p className="text-zinc-400 text-sm mb-6">
                            Enter the 6-digit code sent to your email
                        </p>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {demoOtp && (
                            <div className="mb-4 p-3 rounded-lg bg-primary-500/10 border border-primary-500/30 text-primary-300 text-sm">
                                <span className="font-semibold">Demo Mode:</span> Your OTP is <code className="font-mono bg-primary-900/50 px-2 py-0.5 rounded">{demoOtp}</code>
                            </div>
                        )}

                        <div>
                            <label className="input-label">OTP Code</label>
                            <input
                                type="text"
                                className="input-field text-center text-2xl tracking-widest font-mono"
                                placeholder="000000"
                                maxLength={6}
                                value={otpData.otp}
                                onChange={(e) => setOtpData({ ...otpData, otp: e.target.value.replace(/\D/g, '') })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otpData.otp.length !== 6}
                            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="spinner"></div> : 'Verify & Login'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('credentials')}
                            className="btn-secondary w-full mt-3"
                        >
                            Back
                        </button>
                    </form>
                )}

                {/* Security indicator */}
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-zinc-500 text-xs">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Secured with Multi-Factor Authentication
                </div>
            </div>
        </div>
    );
}
