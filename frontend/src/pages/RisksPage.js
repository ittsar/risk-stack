import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import RiskForm from '../components/RiskForm';

const severityClassName = (label) => {
    if (!label) return 'severity-chip';
    switch (label.toLowerCase()) {
        case 'critical':
            return 'severity-chip critical';
        case 'high':
            return 'severity-chip high';
        case 'medium':
            return 'severity-chip medium';
        case 'low':
            return 'severity-chip low';
        default:
            return 'severity-chip very-low';
    }
};

const RisksPage = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteError, setDeleteError] = useState(null);
    const [editingRisk, setEditingRisk] = useState(null);
    const [isCreateCollapsed, setIsCreateCollapsed] = useState(true);
    const [isEditCollapsed, setIsEditCollapsed] = useState(true);

    const fetchRisks = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiRequest('/api/risks/', { token, params });
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchRisks();
        }
    }, [token, fetchRisks]);

    useEffect(() => {
        if (!data) {
            return;
        }

        const items = data.results ?? data;
        if (Array.isArray(items) && items.length === 0 && isCreateCollapsed) {
            setIsCreateCollapsed(false);
        }
    }, [data, isCreateCollapsed]);

    const onSearchSubmit = (event) => {
        event.preventDefault();
        const params = {};
        if (search) {
            params.search = search;
        }
        if (statusFilter) {
            params.status = statusFilter;
        }
        fetchRisks(params);
    };

    const risks = data?.results ?? [];
    const total = data?.count ?? risks.length;

    const statusOptions = useMemo(
        () => [
            { value: '', label: 'All statuses' },
            { value: 'identified', label: 'Identified' },
            { value: 'analyzing', label: 'Analyzing' },
            { value: 'mitigating', label: 'Mitigating' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'closed', label: 'Closed' },
        ],
        []
    );

    const handleDelete = useCallback(
        async (riskId) => {
            const confirmed = window.confirm('Delete this risk? This action cannot be undone.');
            if (!confirmed) return;

            setDeleteError(null);
            try {
                await apiRequest(`/api/risks/${riskId}/`, { method: 'DELETE', token });
                setEditingRisk((current) => {
                    if (current?.id === riskId) {
                        setIsEditCollapsed(true);
                        return null;
                    }
                    return current;
                });
                fetchRisks({ search, status: statusFilter });
            } catch (err) {
                setDeleteError('Failed to delete risk.');
            }
        },
        [token, fetchRisks, search, statusFilter]
    );

    return (
        <div>
            <div className="page-header">
                <h1>Risks</h1>
                <span style={{ color: '#64748b' }}>{total} total</span>
            </div>

            {editingRisk && (
                <RiskForm
                    mode="edit"
                    risk={editingRisk}
                    onSuccess={() => fetchRisks({ search, status: statusFilter })}
                    onCancel={() => {
                        setEditingRisk(null);
                        setIsEditCollapsed(true);
                    }}
                    isCollapsed={isEditCollapsed}
                    setIsCollapsed={setIsEditCollapsed}
                />
            )}

            <RiskForm
                onSuccess={() => fetchRisks({ search, status: statusFilter })}
                isCollapsed={isCreateCollapsed}
                setIsCollapsed={setIsCreateCollapsed}
            />

            <div className="card" style={{ marginTop: '24px' }}>
                <form className="table-actions" onSubmit={onSearchSubmit}>
                    <input
                        type="search"
                        placeholder="Search risks..."
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
                                <th>Risk</th>
                                <th>Project</th>
                                <th>Status</th>
                                <th>Severity</th>
                                <th>Likelihood</th>
                                <th>Impact</th>
                                <th>Frameworks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {risks.map((risk) => (
                                <tr key={risk.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{risk.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{risk.owner || 'Unassigned'}</div>
                                    </td>
                                    <td>{risk.project_detail?.name || '—'}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{risk.status.replace('_', ' ')}</td>
                                    <td>
                                        <span className={severityClassName(risk.severity_label)}>{risk.severity_label || 'N/A'}</span>
                                    </td>
                                    <td>{risk.likelihood}</td>
                                    <td>{risk.impact}</td>
                                    <td>
                                        {risk.frameworks.length === 0
                                            ? '—'
                                            : risk.frameworks.map((framework) => framework.code).join(', ')}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingRisk(risk);
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
                                                onClick={() => handleDelete(risk.id)}
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

export default RisksPage;
