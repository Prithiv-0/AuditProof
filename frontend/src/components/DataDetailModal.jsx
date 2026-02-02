import { useState, useEffect } from 'react';
import { dataAPI } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

export default function DataDetailModal({ data, onClose }) {
    const [fullData, setFullData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFullData();
    }, [data.id]);

    const fetchFullData = async () => {
        try {
            const response = await dataAPI.getById(data.id);
            setFullData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch data details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'verified': return 'text-green-400 bg-green-500/20 border-green-500/30';
            case 'corrupted': return 'text-red-400 bg-red-500/20 border-red-500/30';
            default: return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="glass-card w-full max-w-3xl p-6 animate-fadeIn my-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">{data.title}</h2>
                        <p className="text-zinc-400 text-sm mt-1">
                            Submitted by {data.researcher_name} • {new Date(data.created_at).toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white p-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="spinner w-8 h-8"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Status Badge */}
                        <div className="flex items-center gap-4">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold uppercase ${getStatusColor(data.status || 'pending')}`}>
                                {data.status === 'verified' && (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {data.status === 'corrupted' && (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {(data.status || 'pending') === 'pending' && (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {data.status || 'Pending Verification'}
                            </span>
                        </div>

                        {/* Description */}
                        {data.description && (
                            <div className="p-4 rounded-xl bg-dark-300">
                                <label className="text-xs text-zinc-500 uppercase tracking-wider">Description</label>
                                <p className="text-zinc-200 mt-2">{data.description}</p>
                            </div>
                        )}

                        {/* Security Details Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Left Column - Crypto Info */}
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-dark-300">
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Integrity Hash (SHA-256)</label>
                                    <code className="text-sm text-primary-400 block mt-2 break-all font-mono">
                                        {data.original_hash || fullData?.integrity?.hash || 'Not available'}
                                    </code>
                                </div>

                                <div className="p-4 rounded-xl bg-dark-300">
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Encryption Status</label>
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                            <span className="text-zinc-300">AES-256-GCM Encrypted</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                            <span className="text-zinc-300">RSA-2048 Key Exchange</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                            <span className="text-zinc-300">Digitally Signed</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-dark-300">
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Encrypted Content Preview</label>
                                    <div className="mt-2 p-3 bg-dark-400 rounded-lg overflow-hidden">
                                        <code className="text-xs text-zinc-500 break-all font-mono">
                                            {fullData?.encryptedContent || 'U2FsdGVkX1+abc123...'}
                                        </code>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-2">
                                        Content is encrypted and can only be decrypted by authorized auditors
                                    </p>
                                </div>
                            </div>

                            {/* Right Column - QR & Info */}
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-dark-300 flex flex-col items-center">
                                    <label className="text-xs text-zinc-500 uppercase tracking-wider self-start">Verification QR Code</label>
                                    <div className="bg-white p-4 rounded-xl mt-3">
                                        <QRCodeSVG
                                            value={JSON.stringify({
                                                id: data.id,
                                                hash: data.original_hash?.substring(0, 32),
                                                title: data.title
                                            })}
                                            size={150}
                                            level="M"
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-3 text-center">
                                        Scan to verify data authenticity
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20">
                                    <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Immutable Record
                                    </h4>
                                    <p className="text-sm text-zinc-400 mt-2">
                                        This data is sealed with cryptographic proof. Any modification—even by system administrators—will be detected during verification.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="p-4 rounded-xl bg-dark-300">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider">Audit Timeline</label>
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm text-white">Data Uploaded & Encrypted</div>
                                        <div className="text-xs text-zinc-500">{new Date(data.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                {data.verification_status && data.verification_status !== 'pending' && (
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${data.status === 'verified' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                            <svg className={`w-4 h-4 ${data.status === 'verified' ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={data.status === 'verified' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-sm text-white">
                                                {data.status === 'verified' ? 'Integrity Verified' : 'Tampering Detected'}
                                            </div>
                                            <div className="text-xs text-zinc-500">By auditor</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Close Button */}
                <div className="mt-6 pt-6 border-t border-white/10">
                    <button onClick={onClose} className="btn-secondary w-full">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
