import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const AssetsPage = () => {
    const { token } = useAuth();
    const [assets, setAssets] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAssets = async () => {
            try {
                const response = await apiRequest('/api/assets/', { token });
                setAssets(response.results ?? response);
            } catch (err) {
                setError(err.message);
            }
        };

        if (token) {
            loadAssets();
        }
    }, [token]);

    return (
        <div>
            <div className="page-header">
                <h1>Assets</h1>
            </div>
            <div className="card">
                {error ? (
                    <p style={{ color: '#dc2626' }}>Failed to load assets: {error}</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th>Type</th>
                                <th>Owner</th>
                                <th>Project</th>
                                <th>Criticality</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map((asset) => (
                                <tr key={asset.id}>
                                    <td>{asset.name}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{asset.asset_type}</td>
                                    <td>{asset.business_owner || '—'}</td>
                                    <td>{asset.project_detail?.name || '—'}</td>
                                    <td>{asset.criticality || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AssetsPage;
