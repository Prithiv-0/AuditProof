import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, dataAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import VerifyModal from '../components/VerifyModal';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isResearcher, isAuditor, isAdmin } = useAuth();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPageId, setSelectedPageId] = useState(null);
    const [pageContent, setPageContent] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [isNewPage, setIsNewPage] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form for new/edit
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');

    const [showVerify, setShowVerify] = useState(false);

    useEffect(() => {
        fetchProject();
    }, [id]);

    useEffect(() => {
        if (selectedPageId && !isNewPage) {
            fetchPageDetails(selectedPageId);
        }
    }, [selectedPageId]);

    const fetchProject = async () => {
        try {
            const response = await projectAPI.getDetails(id);
            setProject(response.data);
            if (response.data.data && response.data.data.length > 0 && !selectedPageId) {
                setSelectedPageId(response.data.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch project:', error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchPageDetails = async (pageId) => {
        try {
            const response = await dataAPI.getById(pageId);
            setPageContent(response.data);
            setTitle(response.data.title);
            setContent(response.data.content || '');
            setDescription(response.data.description || '');
            setEditMode(false);
            setIsNewPage(false);
        } catch (error) {
            console.error('Failed to fetch page:', error);
            setPageContent(null);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            alert('Title and content are required');
            return;
        }

        setSaving(true);
        try {
            if (isNewPage) {
                // Create New
                const response = await dataAPI.upload({ title, description, content, projectId: id });
                // Refresh project and select the new page
                await fetchProject();
                if (response.data?.data?.id) {
                    setSelectedPageId(response.data.data.id);
                }
            } else if (selectedPageId) {
                // Update existing
                await dataAPI.update(selectedPageId, { title, description, content });
                await fetchPageDetails(selectedPageId);
            }
            setEditMode(false);
            setIsNewPage(false);
            fetchProject(); // Refresh sidebar
        } catch (error) {
            console.error('Save error:', error);
            alert(error.response?.data?.error || 'Failed to save research data');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (isNewPage) {
            // Reset to viewing mode, deselect if nothing was there before
            setIsNewPage(false);
            setEditMode(false);
            if (project?.data?.length > 0) {
                setSelectedPageId(project.data[0].id);
            } else {
                setSelectedPageId(null);
                setPageContent(null);
            }
        } else if (selectedPageId && pageContent) {
            // Restore original values
            setTitle(pageContent.title);
            setContent(pageContent.content || '');
            setDescription(pageContent.description || '');
            setEditMode(false);
        } else {
            setEditMode(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedPageId(null);
        setPageContent(null);
        setTitle('');
        setContent('');
        setDescription('');
        setIsNewPage(true);
        setEditMode(true);
    };

    const handleEditClick = () => {
        // Check if this researcher owns the data
        if (pageContent?.researcher_id !== user?.id) {
            alert('You can only edit your own research data.');
            return;
        }
        setEditMode(true);
    };

    // Determine if current user can edit this page
    const canEdit = isResearcher && pageContent?.researcher_id === user?.id;

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="spinner w-10 h-10"></div>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="flex h-[calc(100vh-120px)] gap-1 animate-fadeIn bg-dark-300 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">

                {/* Pages Sidebar (The "Obsidian" feel) */}
                <aside className="w-72 bg-dark-200 border-r border-white/10 flex flex-col">
                    <div className="p-5 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-bold text-white text-sm uppercase tracking-wider">Research Pages</h2>
                        {isResearcher && (
                            <button
                                onClick={handleCreateNew}
                                className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-all"
                                title="New Page"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {project?.data?.length === 0 && !isNewPage ? (
                            <div className="text-center py-10 px-4">
                                <p className="text-zinc-500 text-xs italic">No research data in this project yet.</p>
                                {isResearcher && (
                                    <button
                                        onClick={handleCreateNew}
                                        className="mt-4 text-primary-400 text-sm underline"
                                    >
                                        Create your first note
                                    </button>
                                )}
                            </div>
                        ) : (
                            project?.data?.map(page => (
                                <button
                                    key={page.id}
                                    onClick={() => {
                                        setIsNewPage(false);
                                        setEditMode(false);
                                        setSelectedPageId(page.id);
                                    }}
                                    className={`w-full text-left p-3 rounded-xl transition-all group ${selectedPageId === page.id && !isNewPage
                                            ? 'bg-primary-600/20 shadow-inner'
                                            : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${page.status === 'verified' ? 'bg-green-500' :
                                                page.status === 'corrupted' ? 'bg-red-500' : 'bg-yellow-500'
                                            }`}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${selectedPageId === page.id && !isNewPage ? 'text-primary-400' : 'text-zinc-300'
                                                }`}>
                                                {page.title}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 mt-0.5">
                                                by {page.researcher_name || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-dark-300">
                    {(editMode || isNewPage) ? (
                        /* Editor View */
                        <div className="flex-1 flex flex-col p-8 max-w-4xl mx-auto w-full">
                            <div className="mb-4">
                                <span className="text-xs text-primary-400 font-bold uppercase tracking-widest">
                                    {isNewPage ? '✨ New Research Note' : '✏️ Editing'}
                                </span>
                            </div>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Title..."
                                className="text-4xl font-bold bg-transparent border-none text-white focus:outline-none mb-4 w-full"
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief summary/metadata..."
                                className="text-zinc-500 bg-transparent border-none focus:outline-none mb-8 w-full resize-none h-12 italic"
                            />
                            <div className="flex-1 border-t border-white/5 pt-8">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Start your research notes here..."
                                    className="w-full h-full bg-transparent border-none text-zinc-300 focus:outline-none resize-none text-lg leading-relaxed min-h-[300px]"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn-primary px-8"
                                >
                                    {saving ? 'Securing...' : 'Save & Secure'}
                                </button>
                            </div>
                        </div>
                    ) : selectedPageId && pageContent ? (
                        /* Viewer View */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Toolbar */}
                            <div className="px-8 py-4 border-b border-white/10 flex justify-between items-center bg-dark-200/50">
                                <div className="flex items-center gap-4">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${pageContent?.status === 'verified'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : pageContent?.status === 'corrupted'
                                                ? 'bg-red-500/10 text-red-500 border-red-500/30'
                                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        }`}>
                                        {pageContent?.status || 'Pending Review'}
                                    </div>
                                    <span className="text-xs text-zinc-600 font-mono">
                                        HASH: {pageContent?.original_hash?.substring(0, 16)}...
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {canEdit && (
                                        <button
                                            onClick={handleEditClick}
                                            className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-all"
                                            title="Edit Page"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    )}
                                    {isAuditor && (
                                        <button
                                            onClick={() => setShowVerify(true)}
                                            className="px-4 py-2 rounded-xl bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 transition-all text-sm font-semibold flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            Verify Integrity
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Viewer Content */}
                            <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full custom-scrollbar">
                                <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
                                    {pageContent?.title || 'Untitled'}
                                </h1>
                                <p className="text-zinc-500 text-lg italic mb-10 pb-6 border-b border-white/5">
                                    {pageContent?.description || 'No description provided.'}
                                </p>

                                {/* Content Display */}
                                <div className="prose prose-invert max-w-none">
                                    {pageContent?.content?.startsWith('[ACCESS RESTRICTED') ? (
                                        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                                            <p className="font-bold mb-2">🔒 Access Restricted</p>
                                            <p className="text-sm">{pageContent.content}</p>
                                        </div>
                                    ) : (
                                        <div className="text-zinc-300 text-xl leading-relaxed whitespace-pre-wrap">
                                            {pageContent?.content || 'No content available.'}
                                        </div>
                                    )}
                                </div>

                                {/* Security Footer */}
                                <div className="mt-20 p-6 rounded-2xl bg-white/5 border border-white/5">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Security Record</h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <span className="text-[10px] text-zinc-500">RESEARCHER</span>
                                            <p className="text-sm text-zinc-300 mt-1">{pageContent?.researcher_name || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-zinc-500">INTEGRITY HASH</span>
                                            <p className="text-[10px] font-mono text-primary-500/70 mt-1 break-all">
                                                {pageContent?.original_hash || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex-1 flex items-center justify-center text-center p-12">
                            <div>
                                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Select a Page</h3>
                                <p className="text-zinc-500 max-w-xs mx-auto text-sm">
                                    Pick a research record from the sidebar to view its content and integrity status.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showVerify && pageContent && (
                <VerifyModal
                    data={pageContent}
                    onClose={() => setShowVerify(false)}
                    onComplete={() => {
                        setShowVerify(false);
                        fetchPageDetails(selectedPageId);
                        fetchProject();
                    }}
                />
            )}
        </Layout>
    );
}
