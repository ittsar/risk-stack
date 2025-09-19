import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VulnerabilityForm from '../components/VulnerabilityForm';

const statusFilters = [
    { value: '', label: 'All statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in_review', label: 'In Review' },
    { value: 'mitigating', label: 'Mitigating' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'closed', label: 'Closed' },
];

const severityFilters = [
    { value: '', label: 'All severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'informational', label: 'Informational' },
];

const formatScore = (value) => {
    if (value === null || value === undefined || value === '') {
        return '--';
    }
    return Number(value).toFixed(1);
};

const VulnerabilitiesPage = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [deleteError, setDeleteError] = useState(null);
    const [editingVulnerability, setEditingVulnerability] = useState(null);
    const [isCreateCollapsed, setIsCreateCollapsed] = useState(true);
    const [isEditCollapsed, setIsEditCollapsed] = useState(true);

    const fetchVulnerabilities = useCallback(
        async (params = {}) => {
            if (!token) return;
            setLoading(true);
            setError(null);
            try {
                const response = await apiRequest('/api/vulnerabilities/', { token, params });
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
            fetchVulnerabilities();
        }
    }, [fetchVulnerabilities, token]);

    useEffect(() => {
        const items = (data?.results ?? data) || [];
        if (Array.isArray(items) && items.length === 0 && isCreateCollapsed) {
            setIsCreateCollapsed(false);
        }
    }, [data, isCreateCollapsed]);

    const items = useMemo(() => data?.results ?? data ?? [], [data]);
    const total = data?.count ?? items.length;

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const params = {};
        if (search.trim()) {
            params.search = search.trim();
        }
        if (statusFilter) {
            params.status = statusFilter;
        }
        if (severityFilter) {
            params.severity = severityFilter;
        }
        fetchVulnerabilities(params);
    };

    const handleDelete = useCallback(
        async (id) => {
            const confirmed = window.confirm('Delete this vulnerability? This action cannot be undone.');
            if (!confirmed) return;
            setDeleteError(null);
            try {
                await apiRequest(`/api/vulnerabilities/${id}/`, { method: 'DELETE', token });
                setEditingVulnerability((current) => {
                    if (current?.id === id) {
                        setIsEditCollapsed(true);
                        return null;
                    }
                    return current;
                });
                const params = {};
                if (search.trim()) {
                    params.search = search.trim();
                }
                if (statusFilter) {
                    params.status = statusFilter;
                }
                if (severityFilter) {
                    params.severity = severityFilter;
                }
                fetchVulnerabilities(params);
            } catch (err) {
                setDeleteError('Failed to delete vulnerability.');
            }
        },
        [fetchVulnerabilities, search, statusFilter, severityFilter, token]
    );

    const headingLabel = useMemo(() => {
        if (search.trim()) {
            return `Vulnerabilities matching "${search.trim()}"`;
        }
        return 'Vulnerabilities';
    }, [search]);

    return (
        <div>
            <div className="page-header">
                <h1>{headingLabel}</h1>
                <span style={{ color: '#64748b' }}>{total} total</span>
            </div>

            {editingVulnerability && (
                <VulnerabilityForm
                    mode="edit"
                    vulnerability={editingVulnerability}
                    onSuccess={() => {
                        const params = {};
                        if (search.trim()) params.search = search.trim();
                        if (statusFilter) params.status = statusFilter;
                        if (severityFilter) params.severity = severityFilter;
                        fetchVulnerabilities(params);
                    }}
                    onCancel={() => {
                        setEditingVulnerability(null);
                        setIsEditCollapsed(true);
                    }}
                    isCollapsed={isEditCollapsed}
                    setIsCollapsed={setIsEditCollapsed}
                />
            )}

            <VulnerabilityForm
                onSuccess={() => {
                    const params = {};
                    if (search.trim()) params.search = search.trim();
                    if (statusFilter) params.status = statusFilter;
                    if (severityFilter) params.severity = severityFilter;
                    fetchVulnerabilities(params);
                }}
                isCollapsed={isCreateCollapsed}
                setIsCollapsed={setIsCreateCollapsed}
            />

            <div className="card" style={{ marginTop: '24px' }}>
                <form className="table-actions" onSubmit={handleSearchSubmit}>
                    <input
                        type="search"
                        placeholder="Search vulnerabilities by reference, title, or CVE..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        {statusFilters.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
                        {severityFilters.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Searching...' : 'Apply'}
                    </button>
                </form>

                {error && <p style={{ color: '#dc2626' }}>{error}</p>}
                {deleteError && <p style={{ color: '#dc2626' }}>{deleteError}</p>}

                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Title</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>CVSS</th>
                                <th>CVE</th>
                                <th>Risks</th>
                                <th>Controls</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const risks = item.risks || [];
                                const controls = item.controls || [];
                                return (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 600 }}>{item.reference_id}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{item.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                {item.description ? item.description.slice(0, 120) + (item.description.length > 120 ? '...' : '') : '--'}
                                            </div>
                                        </td>
                                        <td style={{ textTransform: 'capitalize' }}>{item.severity}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{item.status.replace('_', ' ')}</td>
                                        <td>{formatScore(item.cvss_score)}</td>
                                        <td>{item.cve_id || '--'}</td>
                                        <td>
                                            {risks.length === 0
                                                ? '--'
                                                : risks
                                                      .map((risk) => risk.title)
                                                      .slice(0, 3)
                                                      .join(', ') + (risks.length > 3 ? ` +${risks.length - 3} more` : '')}
                                        </td>
                                        <td>
                                            {controls.length === 0
                                                ? '--'
                                                : controls
                                                      .map((control) => control.reference_id)
                                                      .slice(0, 3)
                                                      .join(', ') + (controls.length > 3 ? ` +${controls.length - 3} more` : '')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingVulnerability(item);
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
                                                    onClick={() => handleDelete(item.id)}
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VulnerabilitiesPage;


