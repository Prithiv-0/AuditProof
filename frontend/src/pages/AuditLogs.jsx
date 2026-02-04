import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isAuditor, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Double check permissions (though route protection should handle it)
        if (!isAuditor && !isAdmin) {
            navigate('/dashboard');
            return;
        }
        fetchLogs();
    }, [isAuditor, isAdmin, navigate]);

    const fetchLogs = async () => {
        try {
            const response = await adminAPI.getAuditLogs();
            setLogs(response.data.logs || []);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'VERIFY': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'TAMPER_DETECTED': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'UPLOAD': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'UPDATE': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    return (
        <Layout>
            <div className="animate-fadeIn">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">System Audit Logs</h1>
                        <p className="text-zinc-400 mt-2">Immutable record of all verification events and data modifications</p>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Refresh Logs"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                <div className="glass-card">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="spinner w-8 h-8"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500">
                            No audit logs found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Action</th>
                                        <th className="px-6 py-4">Data Title</th>
                                        <th className="px-6 py-4">Actor</th>
                                        <th className="px-6 py-4">Result</th>
                                        <th className="px-6 py-4">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-sm text-zinc-300 font-mono">
                                                {new Date(log.performed_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white font-medium">
                                                {log.data_title || 'Unknown Data'}
                                                <div className="text-[10px] text-zinc-500 font-mono mt-1">ID: {log.data_id?.substring(0, 8)}...</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-300">
                                                {log.researcher_name || log.auditor_name || 'System'}
                                                <div className="text-xs text-zinc-500 uppercase">{log.verified_by_name ? `Verified by: ${log.verified_by_name}` : ''}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-medium ${log.result === 'SUCCESS' ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {log.result}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-zinc-500 font-mono max-w-xs truncate">
                                                {JSON.stringify(log.details)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
