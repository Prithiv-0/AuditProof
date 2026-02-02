import { QRCodeSVG } from 'qrcode.react';

export default function DataCard({ data, onVerify, onViewDetail, showVerify, isResearcher, style }) {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified':
                return (
                    <span className="badge badge-verified">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                    </span>
                );
            case 'corrupted':
                return (
                    <span className="badge badge-corrupted">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Tampering Detected
                    </span>
                );
            default:
                return (
                    <span className="badge badge-pending">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Pending
                    </span>
                );
        }
    };

    return (
        <div
            className="glass-card p-6 hover-lift animate-fadeIn group"
            style={style}
        >
            <div className="flex flex-col lg:flex-row gap-5">
                {/* Main content */}
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
                                {data.title}
                            </h3>
                            <p className="text-zinc-400 text-sm mt-1">
                                By {data.researcher_name} • {new Date(data.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        {getStatusBadge(data.status)}
                    </div>

                    {data.description && (
                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{data.description}</p>
                    )}

                    {/* Integrity hash - prominent display for researcher */}
                    {data.original_hash && (
                        <div className="mb-4 p-3 rounded-lg bg-dark-300 border border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <label className="text-xs text-zinc-500">SHA-256 Integrity Seal</label>
                            </div>
                            <code className="text-xs text-primary-400 block overflow-hidden text-ellipsis font-mono">
                                {data.original_hash}
                            </code>
                        </div>
                    )}

                    {/* Security indicators */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-dark-300 px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            AES-256-GCM
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-dark-300 px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                            </svg>
                            RSA-2048
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-dark-300 px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Signed
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                        <button
                            onClick={onViewDetail}
                            className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                        </button>
                        {showVerify && (
                            <button
                                onClick={onVerify}
                                className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Verify Integrity
                            </button>
                        )}
                    </div>
                </div>

                {/* QR Code */}
                <div className="flex-shrink-0 lg:pt-0 pt-4 lg:border-t-0 border-t border-white/10">
                    <div className="flex lg:flex-col items-center gap-3">
                        <div className="bg-white p-2.5 rounded-xl">
                            <QRCodeSVG
                                value={JSON.stringify({
                                    id: data.id,
                                    hash: data.original_hash?.substring(0, 32)
                                })}
                                size={80}
                                level="M"
                            />
                        </div>
                        <div className="lg:text-center">
                            <p className="text-xs text-zinc-500">Verification QR</p>
                            <p className="text-xs text-zinc-600">Scan to verify</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
