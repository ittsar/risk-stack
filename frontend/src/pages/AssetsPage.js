import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AssetForm from '../components/AssetForm';

const assetTypeOptions = [
    { value: '', label: 'All types' },
    { value: 'application', label: 'Application' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'process', label: 'Process' },
    { value: 'data', label: 'Data' },
];

const AssetsPage = () => {
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [editingAsset, setEditingAsset] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [isCreateCollapsed, setIsCreateCollapsed] = useState(true);
    const [isEditCollapsed, setIsEditCollapsed] = useState(true);

    const fetchAssets = useCallback(
        async (params = {}) => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiRequest('/api/assets/', { token, params });
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
            fetchAssets();
        }
    }, [token, fetchAssets]);

    useEffect(() => {
        const items = data?.results ?? data;
        if (Array.isArray(items) && items.length === 0 && isCreateCollapsed) {
            setIsCreateCollapsed(false);
        }
    }, [data, isCreateCollapsed]);

    const assets = data?.results ?? data ?? [];
    const total = data?.count ?? assets.length;

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const params = {};
        if (search) {
            params.search = search;
        }
        if (typeFilter) {
            params.asset_type = typeFilter;
        }
        fetchAssets(params);
    };

    const handleDelete = useCallback(
        async (assetId) => {
            const confirmed = window.confirm('Delete this asset? This action cannot be undone.');
            if (!confirmed) return;

            setDeleteError(null);
            try {
                await apiRequest(`/api/assets/${assetId}/`, { method: 'DELETE', token });
                setEditingAsset((current) => {
                    if (current?.id === assetId) {
                        setIsEditCollapsed(true);
                        return null;
                    }
                    return current;
                });
                fetchAssets({ search, asset_type: typeFilter });
            } catch (err) {
                setDeleteError('Failed to delete asset.');
            }
        },
        [token, fetchAssets, search, typeFilter]
    );

    const typeLabel = useMemo(() => {
        const option = assetTypeOptions.find((item) => item.value === typeFilter);
        return option ? option.label : 'All types';
    }, [typeFilter]);

    return (
        <div>
            <div className="page-header">
                <h1>Assets</h1>
                <span style={{ color: '#64748b' }}>
                    {total} total · {typeLabel}
                </span>
            </div>

            {editingAsset && (
                <AssetForm
                    mode="edit"
                    asset={editingAsset}
                    onSuccess={() => fetchAssets({ search, asset_type: typeFilter })}
                    onCancel={() => {
                        setEditingAsset(null);
                        setIsEditCollapsed(true);
                    }}
                    isCollapsed={isEditCollapsed}
                    setIsCollapsed={setIsEditCollapsed}
                />
            )}

            <AssetForm
                onSuccess={() => fetchAssets({ search, asset_type: typeFilter })}
                isCollapsed={isCreateCollapsed}
                setIsCollapsed={setIsCreateCollapsed}
            />

            <div className="card" style={{ marginTop: '24px' }}>
                <form className="table-actions" onSubmit={handleSearchSubmit}>
                    <input
                        type="search"
                        placeholder="Search assets..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                        {assetTypeOptions.map((option) => (
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
                                <th>Asset</th>
                                <th>Type</th>
                                <th>Owner</th>
                                <th>Project</th>
                                <th>Criticality</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map((assetItem) => (
                                <tr key={assetItem.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{assetItem.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {assetItem.description || 'No description'}
                                        </div>
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{assetItem.asset_type}</td>
                                    <td>{assetItem.business_owner || '—'}</td>
                                    <td>{assetItem.project_detail?.name || '—'}</td>
                                    <td>{assetItem.criticality || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingAsset(assetItem);
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
                                                onClick={() => handleDelete(assetItem.id)}
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

export default AssetsPage;
