import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const FrameworksPage = () => {
    const { token } = useAuth();
    const [frameworks, setFrameworks] = useState([]);
    const [risks, setRisks] = useState([]);
    const [activeFramework, setActiveFramework] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [frameworkResponse, riskResponse] = await Promise.all([
                    apiRequest('/api/frameworks/', { token }),
                    apiRequest('/api/risks/', { token }),
                ]);
                const frameworkResults = frameworkResponse.results ?? frameworkResponse;
                const riskResults = riskResponse.results ?? riskResponse;
                setFrameworks(frameworkResults);
                setRisks(riskResults);
                if (frameworkResults.length > 0) {
                    setActiveFramework(frameworkResults[0].code);
                }
            } catch (err) {
                setError(err.message);
            }
        };

        if (token) {
            loadData();
        }
    }, [token]);

    const mappedRisks = useMemo(() => {
        if (!activeFramework) {
            return [];
        }

        return risks.filter((risk) => risk.frameworks.some((framework) => framework.code === activeFramework));
    }, [risks, activeFramework]);

    const activeFrameworkDetails = frameworks.find((framework) => framework.code === activeFramework);

    return (
        <div>
            <div className="page-header">
                <h1>Framework Alignment</h1>
            </div>

            {error && <p style={{ color: 'var(--color-danger)' }}>Failed to load data: {error}</p>}

            <div className="card" style={{ marginBottom: '24px' }}>
                <h2>Frameworks</h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {frameworks.map((framework) => {
                        const isActive = activeFramework === framework.code;
                        return (
                            <button
                                type="button"
                                key={framework.id}
                                onClick={() => setActiveFramework(framework.code)}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '9999px',
                                    border: '1px solid var(--color-border)',
                                    cursor: 'pointer',
                                    backgroundColor: isActive
                                        ? 'var(--color-primary)'
                                        : 'var(--color-surface-lighter)',
                                    color: isActive ? '#0f172a' : 'var(--color-text-muted)',
                                    fontWeight: 600,
                                    boxShadow: isActive ? '0 12px 24px rgba(122, 139, 255, 0.25)' : 'none',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {framework.code}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeFramework && activeFrameworkDetails && activeFrameworkDetails.controls?.length > 0 && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h2>
                        Controls mapped to <span style={{ color: 'var(--color-primary)' }}>{activeFramework}</span>
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeFrameworkDetails.controls.map((control) => (
                                    <tr key={control.id}>
                                        <td>{control.reference_id}</td>
                                        <td>{control.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="card">
                <h2>
                    Risks mapped to <span style={{ color: 'var(--color-primary)' }}>{activeFramework || 'framework'}</span>
                </h2>
                {activeFramework ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Risk</th>
                                <th>Severity</th>
                                <th>Project</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mappedRisks.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>No risks mapped yet.</td>
                                </tr>
                            ) : (
                                mappedRisks.map((risk) => (
                                    <tr key={risk.id}>
                                        <td>{risk.title}</td>
                                        <td>{risk.severity_label}</td>
                                        <td>{risk.project_detail?.name || '--'}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{risk.status.replace('_', ' ')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ color: 'var(--color-text-muted)' }}>Select a framework to view mapped risks.</p>
                )}
            </div>
        </div>
    );
};

export default FrameworksPage;
