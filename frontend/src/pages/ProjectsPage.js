import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProjectForm from '../components/ProjectForm';

const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'closed', label: 'Closed' },
];

const ProjectsPage = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [editingProject, setEditingProject] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isCreateCollapsed, setIsCreateCollapsed] = useState(true);
    const [isEditCollapsed, setIsEditCollapsed] = useState(true);

    const fetchProjects = useCallback(
        async (params = {}) => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiRequest('/api/projects/', { token, params });
                setData(response);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        },
        [token]
    );

    useEffect(() => {
        if (token) {
            fetchProjects();
        }
    }, [token, fetchProjects]);

    useEffect(() => {
        const items = data?.results ?? data;
        if (Array.isArray(items) && items.length === 0 && isCreateCollapsed) {
            setIsCreateCollapsed(false);
        }
    }, [data, isCreateCollapsed]);

    const projects = data?.results ?? data ?? [];
    const total = data?.count ?? projects.length;

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const params = {};
        if (search) {
            params.search = search;
        }
        if (statusFilter) {
            params.status = statusFilter;
        }
        fetchProjects(params);
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm('Delete this project? This action cannot be undone.');
        if (!confirmed) return;

        setDeleteError(null);
        try {
            await apiRequest(`/api/projects/${id}/`, { method: 'DELETE', token });
            if (editingProject && editingProject.id === id) {
                setEditingProject(null);
                setIsEditCollapsed(true);
            }
            fetchProjects({ search, status: statusFilter });
        } catch (err) {
            setDeleteError('Failed to delete project.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Projects</h1>
                <span style={{ color: '#64748b' }}>{total} total</span>
            </div>

            {editingProject && (
                <ProjectForm
                    mode="edit"
                    project={editingProject}
                    onSuccess={() => fetchProjects({ search, status: statusFilter })}
                    onCancel={() => {
                        setEditingProject(null);
                        setIsEditCollapsed(true);
                    }}
                    isCollapsed={isEditCollapsed}
                    setIsCollapsed={setIsEditCollapsed}
                />
            )}

            <ProjectForm
                onSuccess={() => fetchProjects({ search, status: statusFilter })}
                isCollapsed={isCreateCollapsed}
                setIsCollapsed={setIsCreateCollapsed}
            />

            <div className="card" style={{ marginTop: '24px' }}>
                <form className="table-actions" onSubmit={handleSearchSubmit}>
                    <input
                        type="search"
                        placeholder="Search projects..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        {statusOptions.map((option) => (
                            <option value={option.value} key={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Searching…' : 'Apply'}
                    </button>
                </form>

                {error && <p style={{ color: '#dc2626' }}>{error}</p>}
                {deleteError && <p style={{ color: '#dc2626' }}>{deleteError}</p>}

                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Owner</th>
                                <th>Status</th>
                                <th>Timeline</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{project.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {project.description || 'No description'}
                                        </div>
                                    </td>
                                    <td>{project.owner || '—'}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{project.status.replace('_', ' ')}</td>
                                    <td>
                                        {project.start_date || '—'} → {project.target_end_date || '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingProject(project);
                                                    setIsEditCollapsed(false);
                                                    setIsCreateCollapsed(true);
                                                }}
                                                style={{
                                                    background: '#2563eb',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(project.id)}
                                                style={{
                                                    background: '#dc2626',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProjectsPage;
