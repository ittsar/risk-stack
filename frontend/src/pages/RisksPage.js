import React, { useEffect, useState, useMemo } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

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

    const fetchRisks = async (params = {}) => {
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
    };

    useEffect(() => {
        if (token) {
            fetchRisks();
        }
    }, [token]);

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

    return (
        <div>
            <div className="page-header">
                <h1>Risks</h1>
                <span style={{ color: '#64748b' }}>{total} total</span>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
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

                {error && <p style={{ color: '#dc2626' }}>Failed to load risks: {error}</p>}

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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="card">
                <h2>Need to add a new risk?</h2>
                <p>
                    Use the API endpoint <code>POST /api/risks/</code> to create risks programmatically or extend this UI with a
                    form. You can review the OpenAPI schema at{' '}
                    <a href="/api/docs/" target="_blank" rel="noreferrer">
                        API Docs
                    </a>.
                </p>
            </div>
        </div>
    );
};

export default RisksPage;
