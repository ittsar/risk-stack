import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import DirectoryAutocomplete from './DirectoryAutocomplete';

const assetTypeOptions = [
    { value: 'application', label: 'Application' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'process', label: 'Process' },
    { value: 'data', label: 'Data' },
];

const initialState = {
    name: '',
    asset_type: 'application',
    description: '',
    business_owner: '',
    criticality: '',
    project: '',
};

const AssetForm = ({
    onSuccess,
    mode = 'create',
    asset = null,
    onCancel,
    isCollapsed,
    setIsCollapsed,
}) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState(initialState);
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const response = await apiRequest('/api/projects/', { token });
                setProjects(response.results ?? response ?? []);
            } catch (err) {
                // Non-fatal, keep empty list
                setProjects([]);
            }
        };

        if (token) {
            loadProjects();
        }
    }, [token]);

    useEffect(() => {
        if (mode === 'edit' && asset) {
            setFormData({
                name: asset.name || '',
                asset_type: asset.asset_type || 'application',
                description: asset.description || '',
                business_owner: asset.business_owner || '',
                criticality: asset.criticality || '',
                project: asset.project || asset.project_detail?.id || '',
            });
        } else {
            setFormData(initialState);
        }
    }, [mode, asset]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = useCallback(
        async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setError(null);

            const payload = {
                ...formData,
                project: formData.project || null,
            };

            try {
                if (mode === 'edit' && asset) {
                    await apiRequest(`/api/assets/${asset.id}/`, {
                        method: 'PATCH',
                        token,
                        body: payload,
                    });
                    onSuccess?.();
                    onCancel?.();
                } else {
                    await apiRequest('/api/assets/', {
                        method: 'POST',
                        token,
                        body: payload,
                    });
                    setFormData(initialState);
                    onSuccess?.();
                    setIsCollapsed?.(true);
                }
            } catch (err) {
                setError('Failed to save asset. Check the form and try again.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [formData, mode, asset, token, onSuccess, onCancel, setIsCollapsed]
    );

    const collapsed = typeof isCollapsed === 'boolean' ? isCollapsed : false;
    const heading = mode === 'edit' && asset
        ? `Edit Asset – ${asset.name}`
        : mode === 'edit'
        ? 'Edit Asset'
        : 'Create New Asset';
    const toggleLabel = collapsed ? (mode === 'edit' ? 'Expand editor' : 'New asset') : 'Collapse';

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>{heading}</h2>
                {typeof isCollapsed === 'boolean' && setIsCollapsed ? (
                    <button
                        type="button"
                        onClick={() => setIsCollapsed((prev) => !prev)}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#2563eb',
                        }}
                    >
                        {toggleLabel}
                    </button>
                ) : null}
            </div>

            {!collapsed && (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <label htmlFor={`asset-name-${mode}`}>Name</label>
                        <input
                            id={`asset-name-${mode}`}
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gap: '8px' }}>
                        <label htmlFor={`asset-description-${mode}`}>Description</label>
                        <textarea
                            id={`asset-description-${mode}`}
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <label htmlFor={`asset-type-${mode}`}>Asset Type</label>
                            <select
                                id={`asset-type-${mode}`}
                                name="asset_type"
                                value={formData.asset_type}
                                onChange={handleInputChange}
                            >
                                {assetTypeOptions.map((option) => (
                                    <option value={option.value} key={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <DirectoryAutocomplete
                            id={`asset-owner-${mode}-${asset?.id ?? 'new'}`}
                            label="Business Owner"
                            value={formData.business_owner}
                            onChange={(newValue) => setFormData((prev) => ({ ...prev, business_owner: newValue }))}
                            placeholder="Owner name or username"
                        />
                    </div>

                    <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <label htmlFor={`asset-criticality-${mode}`}>Criticality</label>
                            <input
                                id={`asset-criticality-${mode}`}
                                name="criticality"
                                type="text"
                                value={formData.criticality}
                                onChange={handleInputChange}
                                placeholder="e.g. High, Medium"
                            />
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <label htmlFor={`asset-project-${mode}`}>Project</label>
                            <select
                                id={`asset-project-${mode}`}
                                name="project"
                                value={formData.project}
                                onChange={handleInputChange}
                            >
                                <option value="">Unassigned</option>
                                {projects.map((projectItem) => (
                                    <option value={projectItem.id} key={projectItem.id}>
                                        {projectItem.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create asset'}
                        </button>
                        {mode === 'edit' && (
                            <button
                                type="button"
                                onClick={onCancel}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5f5',
                                    background: '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
};

export default AssetForm;
