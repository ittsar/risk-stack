import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CollapsibleFormSection from './CollapsibleFormSection';

const MultiCheckbox = ({ options, selected, onChange, labelKey = 'name', valueKey = 'id', getLabel }) => {
    const handleToggle = (value) => {
        if (selected.includes(value)) {
            onChange(selected.filter((item) => item !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <div style={{ display: 'grid', gap: '8px' }}>
            {options.map((option) => {
                const value = option[valueKey];
                const label = typeof getLabel === 'function' ? getLabel(option) : option[labelKey];
                return (
                    <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            checked={selected.includes(value)}
                            onChange={() => handleToggle(value)}
                        />
                        <span>{label}</span>
                    </label>
                );
            })}
        </div>
    );
};

const ControlForm = ({
    mode = 'create',
    control = null,
    onSuccess,
    onCancel,
    isCollapsed,
    setIsCollapsed,
}) => {
    const { token } = useAuth();
    const [frameworkOptions, setFrameworkOptions] = useState([]);
    const [frameworkControlMap, setFrameworkControlMap] = useState({});
    const [frameworkControlResults, setFrameworkControlResults] = useState([]);
    const [frameworkFilter, setFrameworkFilter] = useState('');
    const [frameworkControlSearch, setFrameworkControlSearch] = useState('');
    const [loadingFrameworkControls, setLoadingFrameworkControls] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const initialState = useMemo(
        () => ({
            reference_id: '',
            name: '',
            description: '',
            framework_ids: [],
            framework_control_ids: [],
        }),
        []
    );

    const [formData, setFormData] = useState(initialState);

    const loadFrameworks = useCallback(async () => {
        const response = await apiRequest('/api/frameworks/', { token });
        const items = response.results ?? response;
        setFrameworkOptions(items.map((item) => ({ id: item.id, code: item.code, name: item.name })));
    }, [token]);

    const mergeFrameworkControls = useCallback((items) => {
        setFrameworkControlMap((prev) => {
            const next = { ...prev };
            items.forEach((item) => {
                next[item.id] = item;
            });
            return next;
        });
    }, []);

    const fetchFrameworkControls = useCallback(async () => {
        if (!token) return;
        setLoadingFrameworkControls(true);
        try {
            const params = {};
            if (frameworkFilter) {
                params.framework = frameworkFilter;
            }
            if (frameworkControlSearch) {
                params.search = frameworkControlSearch;
            }
            const response = await apiRequest('/api/framework-controls/', { token, params });
            const items = response.results ?? response;
            mergeFrameworkControls(items);
            setFrameworkControlResults(items.map((item) => item.id));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingFrameworkControls(false);
        }
    }, [frameworkFilter, frameworkControlSearch, mergeFrameworkControls, token]);

    useEffect(() => {
        if (token) {
            loadFrameworks().catch((err) => setError(err.message));
        }
    }, [loadFrameworks, token]);

    useEffect(() => {
        if (token) {
            fetchFrameworkControls();
        }
    }, [token, fetchFrameworkControls]);

    useEffect(() => {
        if (mode === 'edit' && control) {
            setFormData({
                reference_id: control.reference_id || '',
                name: control.name || '',
                description: control.description || '',
                framework_ids: (control.frameworks || []).map((item) => item.id),
                framework_control_ids: (control.framework_controls || []).map((item) => item.id),
            });
            mergeFrameworkControls(control.framework_controls || []);
        } else {
            setFormData(initialState);
        }
    }, [control, initialState, mergeFrameworkControls, mode]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFrameworkChange = (values) => {
        setFormData((prev) => ({ ...prev, framework_ids: values }));
    };

    const handleFrameworkControlChange = (values) => {
        setFormData((prev) => ({ ...prev, framework_control_ids: values }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);

        const payload = {
            reference_id: formData.reference_id,
            name: formData.name,
            description: formData.description,
            framework_ids: formData.framework_ids,
            framework_control_ids: formData.framework_control_ids,
        };

        try {
            if (mode === 'edit' && control) {
                await apiRequest(`/api/controls/${control.id}/`, {
                    method: 'PATCH',
                    body: payload,
                    token,
                });
                onSuccess?.();
                onCancel?.();
            } else {
                await apiRequest('/api/controls/', {
                    method: 'POST',
                    body: payload,
                    token,
                });
                setFormData(initialState);
                onSuccess?.();
                setIsCollapsed?.(true);
            }
        } catch (err) {
            setError(err.message || 'Failed to save control.');
        } finally {
            setSaving(false);
        }
    };

    const collapsed = typeof isCollapsed === 'boolean' ? isCollapsed : false;
    const heading = mode === 'edit' && control ? `Edit Control - ${control.reference_id}` : mode === 'edit' ? 'Edit Control' : 'Create Control';
    const handleToggle = typeof isCollapsed === 'boolean' && setIsCollapsed ? () => setIsCollapsed((prev) => !prev) : undefined;

    const frameworkOptionsWithLabel = frameworkOptions.map((item) => ({
        id: item.id,
        name: `${item.code} - ${item.name}`,
        code: item.code,
    }));

    const combinedFrameworkControlIds = useMemo(() => {
        return Array.from(new Set([...frameworkControlResults, ...formData.framework_control_ids]));
    }, [frameworkControlResults, formData.framework_control_ids]);

    const frameworkControlOptions = combinedFrameworkControlIds
        .map((id) => frameworkControlMap[id])
        .filter(Boolean)
        .map((item) => ({
            id: item.id,
            label: `[${item.framework_code}] ${item.control_id} - ${item.title || 'Untitled'}`,
        }));

    const selectedFrameworkControls = (control?.framework_controls || [])
        .concat(formData.framework_control_ids
            .filter((id) => !control?.framework_controls?.some((item) => item.id === id))
            .map((id) => frameworkControlMap[id])
            .filter(Boolean));

    return (
        <CollapsibleFormSection
            title={heading}
            collapsed={collapsed}
            onToggle={handleSectionToggle}
            style={{ marginBottom: '24px' }}
        >
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                {error && <p style={{ color: '#dc2626' }}>{error}</p>}

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label htmlFor="reference_id">Reference ID</label>
                    <input
                        id="reference_id"
                        name="reference_id"
                        type="text"
                        value={formData.reference_id}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label htmlFor="name">Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label>Frameworks</label>
                    <MultiCheckbox
                        options={frameworkOptionsWithLabel}
                        selected={formData.framework_ids}
                        onChange={handleFrameworkChange}
                        getLabel={(item) => item.name}
                    />
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'grid', gap: '6px' }}>
                            <label htmlFor="framework-filter">Filter by framework</label>
                            <select
                                id="framework-filter"
                                value={frameworkFilter}
                                onChange={(event) => setFrameworkFilter(event.target.value)}
                            >
                                <option value="">All frameworks</option>
                                {frameworkOptionsWithLabel.map((framework) => (
                                    <option key={framework.id} value={framework.code}>
                                        {framework.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                            <label htmlFor="framework-control-search">Search controls</label>
                            <input
                                id="framework-control-search"
                                type="search"
                                placeholder="Search control identifier or title..."
                                value={frameworkControlSearch}
                                onChange={(event) => setFrameworkControlSearch(event.target.value)}
                            />
                        </div>
                        <div style={{ display: 'grid', gap: '6px', alignContent: 'end' }}>
                            <button type="button" onClick={fetchFrameworkControls} disabled={loadingFrameworkControls}>
                                {loadingFrameworkControls ? 'Loading...' : 'Refresh list'}
                            </button>
                        </div>
                    </div>

                    <div style={{
                        border: '1px solid #cbd5f5',
                        borderRadius: '6px',
                        padding: '12px',
                        maxHeight: '260px',
                        overflowY: 'auto',
                    }}>
                        {frameworkControlOptions.length === 0 ? (
                            <p style={{ color: '#64748b', margin: 0 }}>
                                {loadingFrameworkControls ? 'Loading options...' : 'No framework controls match the current filters.'}
                            </p>
                        ) : (
                            <MultiCheckbox
                                options={frameworkControlOptions}
                                selected={formData.framework_control_ids}
                                onChange={handleFrameworkControlChange}
                                labelKey="label"
                            />
                        )}
                    </div>

                    {selectedFrameworkControls.length > 0 && (
                        <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                            <strong>Selected mappings:</strong>
                            <ul style={{ marginTop: '8px' }}>
                                {selectedFrameworkControls.map((item) => (
                                    <li key={item.id}>
                                        [{item.framework_code}] {item.control_id} - {item.title || 'Untitled'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Create control'}
                    </button>
                    {mode === 'edit' && onCancel ? (
                        <button type="button" onClick={onCancel}>
                            Cancel
                        </button>
                    ) : null}
                </div>
            </form>
        </CollapsibleFormSection>
    );
};

export default ControlForm;
