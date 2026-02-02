import { useState } from 'react';
import { dataAPI } from '../services/api';

export default function UploadModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({ title: '', description: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await dataAPI.upload(formData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-dark-200 rounded-2xl w-full max-w-2xl p-6 animate-fadeIn border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Submit Research Data</h2>
                        <p className="text-zinc-400 text-sm mt-1">Your submission will be securely stored and reviewed</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title Field */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Research Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                            placeholder="e.g., Clinical Trial Phase 2 Results"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    {/* Description Field */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Brief Description
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                            placeholder="Optional summary of your research findings"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Content Field */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Research Data <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            className="w-full px-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors min-h-[200px] resize-y"
                            placeholder="Enter your research data, findings, or results here...

Example:
Study ID: CT-2024-0042
Participants: 1,247
Treatment Group Recovery Rate: 15.2%
Control Group Recovery Rate: 8.1%
Statistical Significance: p < 0.001"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                        />
                    </div>

                    {/* Info Note */}
                    <div className="flex items-start gap-3 p-4 bg-dark-300 rounded-xl border border-white/5">
                        <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-zinc-400">
                            <p>Your submission will be:</p>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-zinc-500">
                                <li>Securely stored with integrity verification</li>
                                <li>Reviewed by authorized auditors</li>
                                <li>Protected against unauthorized modifications</li>
                            </ul>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Submit for Review
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-dark-300 hover:bg-dark-400 text-zinc-300 font-medium rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
