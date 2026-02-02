import { useState, useEffect } from 'react';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user, isResearcher, isAuditor, isAdmin } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await projectAPI.getAll();
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="animate-fadeIn">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Research Projects</h1>
                        <p className="text-zinc-400 mt-2">
                            {isAdmin ? 'System-wide research projects management' : 'Your assigned research workspace'}
                        </p>
                    </div>
                    {isAdmin && (
                        <Link to="/admin" className="btn-primary flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Manage Projects
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse"></div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="bg-dark-200 rounded-3xl p-16 text-center border border-white/5">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800 flex items-center justify-center">
                            <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No projects found</h3>
                        <p className="text-zinc-400 max-w-sm mx-auto">
                            {isAdmin ? "Start by creating a new project and assigning researchers." : "You haven't been assigned to any projects yet."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                to={`/project/${project.id}`}
                                className="group bg-dark-200 hover:bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-primary-500/50 transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-dark-200 bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">
                                                U{i}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                                <p className="text-zinc-400 text-sm line-clamp-2 mb-4 h-10">
                                    {project.description || 'No description provided for this research project.'}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <span className="text-xs text-zinc-500">
                                        Last active: {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-1 text-primary-400 text-sm font-medium">
                                        Enter <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
