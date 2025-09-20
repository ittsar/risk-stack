import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ControlForm from '../components/ControlForm';

const ControlsPage = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [editingControl, setEditingControl] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isCreateCollapsed, setIsCreateCollapsed] = useState(true);
    const [isEditCollapsed, setIsEditCollapsed] = useState(true);

    const fetchControls = useCallback(
        async (params = {}) => {
            if (!token) return;
            setLoading(true);
            setError(null);
            try {
                const response = await apiRequest('/api/controls/', { token, params });
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
        fetchControls();
    }, [fetchControls]);

    const items = data?.results ?? data ?? [];
    const total = data?.count ?? items.length;

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const params = {};
        if (search.trim()) {
            params.search = search.trim();
        }
        fetchControls(params);
    };

    const handleDelete = useCallback(
        async (controlId) => {
            const confirmed = window.confirm('Delete this control? This action cannot be undone.');
            if (!confirmed) return;
            setDeleteError(null);
            try {
                await apiRequest(`/api/controls/${controlId}/`, { method: 'DELETE', token });
                setEditingControl((current) => {
                    if (current?.id === controlId) {
                        setIsEditCollapsed(true);
                        return null;
                    }
                    return current;
                });
                const params = search.trim() ? { search: search.trim() } : {};
                fetchControls(params);
            } catch (err) {
                setDeleteError('Failed to delete control.');
            }
        },
        [fetchControls, search, token]
    );

    const headingLabel = useMemo(() => {
        return search.trim() ? `Controls matching "${search.trim()}"` : 'Controls';
    }, [search]);

    return (
        <div>
            <div className="page-header">
                <h1>{headingLabel}</h1>
                <span style={{ color: 'var(--color-text-muted)' }}>{total} total</span>
            </div>

            {editingControl && (
                <ControlForm
                    mode="edit"
                    control={editingControl}
                    onSuccess={() => {
                        const params = search.trim() ? { search: search.trim() } : {};
                        fetchControls(params);
                    }}
                    onCancel={() => {
                        setEditingControl(null);
                        setIsEditCollapsed(true);
                    }}
                    isCollapsed={isEditCollapsed}
                    setIsCollapsed={setIsEditCollapsed}
                />
            )}

            <ControlForm
                onSuccess={() => {
                    const params = search.trim() ? { search: search.trim() } : {};
                    fetchControls(params);
                }}
                isCollapsed={isCreateCollapsed}
                setIsCollapsed={setIsCreateCollapsed}
            />

            <div className="card" style={{ marginTop: '24px' }}>
                <form className="table-actions" onSubmit={handleSearchSubmit}>
                    <input
                        type="search"
                        placeholder="Search controls by reference or name..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
                {deleteError && <p style={{ color: 'var(--color-danger)' }}>{deleteError}</p>}

                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Name</th>
                                <th>Frameworks</th>
                                <th>Mapped Framework Controls</th>
                                <th>Vulnerabilities</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((controlItem) => {
                                const frameworks = controlItem.frameworks ?? [];
                                const frameworkControls = controlItem.framework_controls ?? [];
                                const vulnerabilities = controlItem.vulnerabilities ?? [];
                                return (
                                    <tr key={controlItem.id}>
                                        <td style={{ fontWeight: 600 }}>{controlItem.reference_id}</td>
                                        <td>{controlItem.name}</td>
                                        <td>
                                            {frameworks.length === 0
                                                ? '-'
                                                : frameworks
                                                      .map((framework) => framework.code)
                                                      .sort()
                                                      .join(', ')}
                                        </td>
                                        <td>
                                            {frameworkControls.length === 0 ? (
                                                '-'
                                            ) : (
                                                <div style={{ display: 'grid', gap: '4px' }}>
                                                    {frameworkControls.slice(0, 3).map((item) => (
                                                        <span key={item.id} style={{ display: 'block' }}>
                                                            [{item.framework_code}] {item.control_id}
                                                        </span>
                                                    ))}
                                                    {frameworkControls.length > 3 ? (
                                                        <span style={{ color: '#475569', fontSize: '0.85rem' }}>
                                                            +{frameworkControls.length - 3} more
                                                        </span>
                                                    ) : null}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {vulnerabilities.length === 0 ? (
                                                '-'
                                            ) : (
                                                <div style={{ display: 'grid', gap: '4px' }}>
                                                    {vulnerabilities.slice(0, 3).map((item) => (
                                                        <span key={item.id} style={{ display: 'block' }}>
                                                            {item.reference_id}
                                                        </span>
                                                    ))}
                                                    {vulnerabilities.length > 3 ? (
                                                        <span style={{ color: '#475569', fontSize: '0.85rem' }}>
                                                            +{vulnerabilities.length - 3} more
                                                        </span>
                                                    ) : null}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingControl(controlItem);
                                                        setIsEditCollapsed(false);
                                                        setIsCreateCollapsed(true);
                                                    }}
                                                    style={{
                                                        background: 'var(--color-primary)',
                                                        color: '#0f172a',
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
                                                    onClick={() => handleDelete(controlItem.id)}
                                                    style={{
                                                        background: 'var(--color-danger)',
                                                        color: '#0f172a',
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ControlsPage;
