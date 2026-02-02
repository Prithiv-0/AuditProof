import { useState, useEffect } from 'react';
import { adminAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function AdminPanel() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');

    // Modals
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [showAssign, setShowAssign] = useState(false);

    // Form states
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [assignment, setAssignment] = useState({ projectId: '', userId: '', role: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, projectsRes, statsRes] = await Promise.all([
                adminAPI.getUsers(),
                projectAPI.getAll(),
                adminAPI.getStats()
            ]);
            setUsers(usersRes.data.users || []);
            setProjects(projectsRes.data || []);
            setStats(statsRes.data.stats);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await projectAPI.create(newProject);
            setShowCreateProject(false);
            setNewProject({ name: '', description: '' });
            fetchData();
        } catch (err) {
            alert('Failed to create project');
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await projectAPI.assignUser(assignment);
            setShowAssign(false);
            fetchData();
            alert('User assigned successfully');
        } catch (err) {
            alert('Failed to assign user');
        }
    };

    if (loading) return (
        <Layout>
            <div className="flex justify-center py-20"><div className="spinner w-10 h-10"></div></div>
        </Layout>
    );

    return (
        <Layout>
            <div className="animate-fadeIn">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white">Cloud Control Panel</h1>
                        <p className="text-zinc-500 mt-2">Scale research operations and manage secure access</p>
                    </div>
                </div>

                {/* Main Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="glass-card p-6 border-l-4 border-primary-500">
                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Users</div>
                        <div className="text-3xl font-black text-white">{stats?.total_users || 0}</div>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-blue-500">
                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Projects</div>
                        <div className="text-3xl font-black text-white">{projects.length || 0}</div>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-green-500">
                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Records Secured</div>
                        <div className="text-3xl font-black text-white">{stats?.total_records || 0}</div>
                    </div>
                    <div className="glass-card p-6 border-l-4 border-red-500">
                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Integrity Alerts</div>
                        <div className="text-3xl font-black text-white">{stats?.tamper_detections || 0}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-black/20 p-1.5 rounded-2xl w-fit">
                    {['users', 'projects', 'assignments'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-primary-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="glass-card min-h-[500px] p-8">
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6">Network Nodes (Users)</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase font-bold tracking-widest">
                                            <th className="pb-4">Identification</th>
                                            <th className="pb-4">Role</th>
                                            <th className="pb-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map(u => (
                                            <tr key={u.id} className="group hover:bg-white/5 transition-all">
                                                <td className="py-4">
                                                    <div className="font-bold text-white group-hover:text-primary-400 transition-colors">{u.username}</div>
                                                    <div className="text-xs text-zinc-600">{u.email}</div>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                            u.role === 'auditor' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                                        }`}>{u.role}</span>
                                                </td>
                                                <td className="py-4 text-xs text-zinc-500">Active Node</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div>
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-xl font-bold text-white">Provisioned Projects</h2>
                                <button
                                    onClick={() => setShowCreateProject(true)}
                                    className="btn-primary"
                                > + Provision New Project</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projects.map(p => (
                                    <div key={p.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 group hover:border-primary-500/30 transition-all">
                                        <h3 className="font-bold text-white text-lg mb-2">{p.name}</h3>
                                        <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{p.description}</p>
                                        <div className="text-[10px] font-mono text-zinc-700">ENTITYID: {p.id}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div>
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-xl font-bold text-white">Access Matrix Assignments</h2>
                                <button
                                    onClick={() => setShowAssign(true)}
                                    className="btn-primary"
                                > + New Assignment</button>
                            </div>
                            <p className="text-zinc-500 mb-8 italic text-sm">Use this view to link researchers and auditors to specific project environments.</p>
                            {/* In a real app, listing current assignments would be here */}
                            <div className="p-10 rounded-3xl bg-dark-400/50 border border-dashed border-white/10 text-center text-zinc-600">
                                Assignment list ready for expansion.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Project Modal */}
            {showCreateProject && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
                    <div className="glass-card w-full max-w-lg p-8 animate-fadeIn">
                        <h3 className="text-2xl font-bold text-white mb-6">Initialize New Project</h3>
                        <form onSubmit={handleCreateProject} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Project Name</label>
                                <input
                                    required
                                    className="w-full bg-dark-300 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-primary-500"
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label>
                                <textarea
                                    className="w-full bg-dark-300 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-primary-500 h-24"
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="flex-1 btn-primary">Initialize</button>
                                <button type="button" onClick={() => setShowCreateProject(false)} className="px-6 text-zinc-500 hover:text-white">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {showAssign && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
                    <div className="glass-card w-full max-w-lg p-8 animate-fadeIn">
                        <h3 className="text-2xl font-bold text-white mb-6">User-Project Assignment</h3>
                        <form onSubmit={handleAssign} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Target Project</label>
                                <select
                                    required
                                    className="w-full bg-dark-300 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-primary-500"
                                    value={assignment.projectId}
                                    onChange={e => setAssignment({ ...assignment, projectId: e.target.value })}
                                >
                                    <option value="">Select Project...</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Target User</label>
                                <select
                                    required
                                    className="w-full bg-dark-300 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-primary-500"
                                    value={assignment.userId}
                                    onChange={e => setAssignment({ ...assignment, userId: e.target.value })}
                                >
                                    <option value="">Select User...</option>
                                    {users.filter(u => u.role !== 'admin').map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="flex-1 btn-primary">Assign Access</button>
                                <button type="button" onClick={() => setShowAssign(false)} className="px-6 text-zinc-500 hover:text-white">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
