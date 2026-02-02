import { useState } from 'react';
import { dataAPI } from '../services/api';

export default function VerifyModal({ data, onClose, onComplete }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tamperLoading, setTamperLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTamperConfirm, setShowTamperConfirm] = useState(false);

    const handleVerify = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await dataAPI.verify(data.id);
            setResult(response.data);
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSimulateTamper = async () => {
        setTamperLoading(true);
        setError('');

        try {
            const response = await dataAPI.simulateTamper(data.id);
            setShowTamperConfirm(false);
            setResult(null);
            alert('✅ ' + response.data.message + '\n\n' + response.data.details);
        } catch (err) {
            console.error('Tamper error:', err);
            setError(err.response?.data?.error || 'Failed to simulate tampering. ' + (err.response?.data?.hint || ''));
        } finally {
            setTamperLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="glass-card w-full max-w-lg p-6 animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">🔍 Integrity Verification</h2>
                        <p className="text-zinc-400 text-sm mt-1">Verify that research data has not been tampered with</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Data info */}
                <div className="p-4 rounded-xl bg-dark-300 mb-6">
                    <h3 className="font-medium text-white">{data.title}</h3>
                    <p className="text-zinc-400 text-sm mt-1">By {data.researcher_name}</p>
                    {data.original_hash && (
                        <div className="mt-3">
                            <label className="text-xs text-zinc-500">Stored Integrity Hash (SHA-256)</label>
                            <code className="text-xs text-primary-400 block mt-1 break-all font-mono bg-dark-400 p-2 rounded">
                                {data.original_hash}
                            </code>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        <strong>Error: </strong>{error}
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className={`mb-6 p-6 rounded-xl text-center ${result.verified
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                        }`}>
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${result.verified ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}>
                            {result.verified ? (
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                        </div>

                        <h3 className={`text-xl font-bold mb-2 ${result.verified ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {result.integrityStatus}
                        </h3>

                        <p className={`text-sm ${result.verified ? 'text-green-300' : 'text-red-300'}`}>
                            {result.message}
                        </p>

                        <p className="text-xs text-zinc-500 mt-4">
                            Verified by {result.verifiedBy} at {new Date(result.verifiedAt).toLocaleString()}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleVerify}
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                Checking Integrity...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {result ? 'Verify Again' : 'Run Verification'}
                            </>
                        )}
                    </button>

                    {/* Simulate Attack Section - AUDITOR ONLY */}
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                        <h4 className="text-sm font-medium text-red-400 flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Demo: Simulate Database Attack
                        </h4>
                        <p className="text-xs text-zinc-400 mb-3">
                            <strong>Scenario:</strong> A malicious insider or hacker gains direct database access and modifies the encrypted research data blob. This simulates what happens when someone bypasses the application and tampers with stored data directly.
                        </p>
                        <p className="text-xs text-zinc-500 mb-3 italic">
                            After injecting tampering, run "Verify Integrity" to see how the system detects the attack.
                        </p>
                        <button
                            onClick={() => setShowTamperConfirm(true)}
                            className="btn-danger w-full text-sm py-2"
                        >
                            🔓 Inject Tampering (DB Attack Simulation)
                        </button>
                    </div>
                </div>

                {/* Close button */}
                {result && (
                    <button
                        onClick={onComplete}
                        className="btn-secondary w-full mt-4"
                    >
                        Done
                    </button>
                )}

                {/* Tamper confirmation modal */}
                {showTamperConfirm && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
                        <div className="glass-card p-6 max-w-sm animate-fadeIn">
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white">Simulate Database Attack?</h3>
                            </div>
                            <p className="text-zinc-400 text-sm mb-4 text-center">
                                This will modify the <code className="text-red-400">encrypted_content</code> field in the database, simulating what would happen if a hacker gained direct database access.
                            </p>
                            <p className="text-zinc-500 text-xs mb-4 text-center italic">
                                The stored hash will NOT match after tampering, proving the system detects unauthorized modifications.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSimulateTamper}
                                    disabled={tamperLoading}
                                    className="btn-danger flex-1 flex items-center justify-center gap-2"
                                >
                                    {tamperLoading ? (
                                        <div className="spinner"></div>
                                    ) : (
                                        'Inject Attack'
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowTamperConfirm(false)}
                                    className="btn-secondary flex-1"
                                    disabled={tamperLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
