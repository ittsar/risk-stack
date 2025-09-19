import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
    const { token } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardData, riskSummary] = await Promise.all([
                    apiRequest('/api/dashboard/', { token }),
                    apiRequest('/api/risks/summary/', { token }),
                ]);
                setMetrics(dashboardData);
                setSummary(riskSummary);
            } catch (err) {
                setError(err.message);
            }
        };

        if (token) {
            fetchData();
        }
    }, [token]);

    if (error) {
        return <div className="card">Failed to load dashboard: {error}</div>;
    }

    if (!metrics || !summary) {
        return <div className="card">Loading dashboard...</div>;
    }

    const statCards = [
        { label: 'Projects', value: metrics.projects },
        { label: 'Risks', value: metrics.risks },
        { label: 'Open Findings', value: metrics.open_findings },
        { label: 'Assets', value: metrics.assets },
        { label: 'Controls', value: metrics.controls },
        { label: 'Frameworks', value: metrics.frameworks },
    ];

    const severityOrder = ['Critical', 'High', 'Medium', 'Low', 'Very Low'];

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
            </div>

            <div className="stat-grid">
                {statCards.map((card) => (
                    <div className="stat-card" key={card.label}>
                        <h3>{card.label}</h3>
                        <p>{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
                <h2>Risk Severity Heatmap</h2>
                <div className="heatmap-grid">
                    {severityOrder.map((label) => {
                        const count = summary.by_severity[label] || 0;
                        return (
                            <div className="heatmap-cell" key={label}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</div>
                                <div style={{ fontSize: '1.5rem' }}>{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="card">
                <h2>Risks by Status</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary.by_status.map((item) => (
                            <tr key={item.status}>
                                <td style={{ textTransform: 'capitalize' }}>{item.status.replace('_', ' ')}</td>
                                <td>{item.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DashboardPage;
