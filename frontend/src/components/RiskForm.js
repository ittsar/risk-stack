import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import DirectoryAutocomplete from './DirectoryAutocomplete';
import CollapsibleFormSection from './CollapsibleFormSection';

const initialState = {
    title: '',
    description: '',
    owner: '',
    project: '',
    status: 'identified',
    likelihood: 3,
    impact: 3,
    target_resolution_date: '',
    framework_ids: [],
    asset_ids: [],
    control_ids: [],
    mitigation_plan: '',
};

const RiskForm = ({
    onSuccess,
    mode = 'create',
    risk = null,
    onCancel,
    isCollapsed,
    setIsCollapsed,
}) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState(initialState);
    const [projects, setProjects] = useState([]);
    const [frameworks, setFrameworks] = useState([]);
    const [assets, setAssets] = useState([]);
    const [controls, setControls] = useState([]);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [projectResp, frameworkResp, assetResp, controlResp] = await Promise.all([
                    apiRequest('/api/projects/', { token }),
                    apiRequest('/api/frameworks/', { token }),
                    apiRequest('/api/assets/', { token }),
                    apiRequest('/api/controls/', { token }),
                ]);

                setProjects(projectResp.results ?? projectResp);
                setFrameworks(frameworkResp.results ?? frameworkResp);
                setAssets(assetResp.results ?? assetResp);
                setControls(controlResp.results ?? controlResp);
            } catch (err) {
                setError('Failed to load reference data.');
            }
        };

        if (token) {
            loadOptions();
        }
    }, [token]);

    useEffect(() => {
        if (mode === 'edit' && risk) {
            setFormData({
                title: risk.title || '',
                description: risk.description || '',
                owner: risk.owner || '',
                project: risk.project || risk.project_detail?.id || '',
                status: risk.status || 'identified',
                likelihood: risk.likelihood || 3,
                impact: risk.impact || 3,
                target_resolution_date: risk.target_resolution_date || '',
                mitigation_plan: risk.mitigation_plan || '',
                framework_ids: risk.frameworks?.map((framework) => framework.id) || [],
                asset_ids: risk.assets?.map((asset) => asset.id) || [],
                control_ids: risk.controls?.map((control) => control.id) || [],
            });
        } else {
            setFormData(initialState);
        }
    }, [mode, risk]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const payload = {
            ...formData,
            likelihood: Number(formData.likelihood),
            impact: Number(formData.impact),
            project: formData.project || null,
            target_resolution_date: formData.target_resolution_date || null,
        };

        try {
            if (mode === 'edit' && risk) {
                await apiRequest(`/api/risks/${risk.id}/`, { method: 'PATCH', body: payload, token });
                onSuccess?.();
                onCancel?.();
            } else {
                await apiRequest('/api/risks/', { method: 'POST', body: payload, token });
                setFormData(initialState);
                onSuccess?.();
                setIsCollapsed?.(true);
            }
        } catch (err) {
            setError('Failed to save risk. Check the form and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const collapsed = typeof isCollapsed === 'boolean' ? isCollapsed : false;
    const heading = mode === 'edit' && risk ? `Edit Risk - ${risk.title}` : mode === 'edit' ? 'Edit Risk' : 'Create New Risk';
    const handleToggle = typeof isCollapsed === 'boolean' && setIsCollapsed ? () => setIsCollapsed((prev) => !prev) : undefined;

    return (
        <CollapsibleFormSection title={heading} collapsed={collapsed} onToggle={handleToggle}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                    <label htmlFor={`risk-title-${mode}`}>Title</label>
                    <input
                        id={`risk-title-${mode}`}
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label htmlFor={`risk-description-${mode}`}>Description</label>
                    <textarea
                        id={`risk-description-${mode}`}
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <DirectoryAutocomplete
                        id={`risk-owner-${mode}-${risk?.id ?? 'new'}`}
                        label="Owner"
                        value={formData.owner}
                        onChange={(newValue) => setFormData((prev) => ({ ...prev, owner: newValue }))}
                        placeholder="Owner name or username"
                    />
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <label htmlFor={`risk-project-${mode}`}>Project</label>
                        <select
                            id={`risk-project-${mode}`}
                            name="project"
                            value={formData.project}
                            onChange={handleInputChange}
                        >
                            <option value="">Unassigned</option>
                            {projects.map((projectItem) => (
                                <option key={projectItem.id} value={projectItem.id}>
                                    {projectItem.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <label htmlFor={`risk-status-${mode}`}>Status</label>
                        <select
                            id={`risk-status-${mode}`}
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                        >
                            {['identified', 'analyzing', 'mitigating', 'accepted', 'closed'].map((value) => (
                                <option key={value} value={value}>
                                    {value.charAt(0).toUpperCase() + value.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <label htmlFor={`risk-likelihood-${mode}`}>Likelihood</label>
                        <select
                            id={`risk-likelihood-${mode}`}
                            name="likelihood"
                            value={formData.likelihood}
                            onChange={handleInputChange}
                        >
                            {[1, 2, 3, 4, 5].map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <label htmlFor={`risk-impact-${mode}`}>Impact</label>
                        <select
                            id={`risk-impact-${mode}`}
                            name="impact"
                            value={formData.impact}
                            onChange={handleInputChange}
                        >
                            {[1, 2, 3, 4, 5].map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label htmlFor={`risk-target-${mode}`}>Target Resolution Date</label>
                    <input
                        id={`risk-target-${mode}`}
                        name="target_resolution_date"
                        type="date"
                        value={formData.target_resolution_date}
                        onChange={handleInputChange}
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label>Frameworks</label>
                    <MultiCheckbox
                        options={frameworks}
                        selected={formData.framework_ids}
                        onChange={(value) => handleMultiSelectChange('framework_ids', value)}
                        labelKey="code"
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label>Assets</label>
                    <MultiCheckbox
                        options={assets}
                        selected={formData.asset_ids}
                        onChange={(value) => handleMultiSelectChange('asset_ids', value)}
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label>Controls</label>
                    <MultiCheckbox
                        options={controls}
                        selected={formData.control_ids}
                        onChange={(value) => handleMultiSelectChange('control_ids', value)}
                        labelKey="reference_id"
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label htmlFor={`risk-mitigation-${mode}`}>Mitigation Plan</label>
                    <textarea
                        id={`risk-mitigation-${mode}`}
                        name="mitigation_plan"
                        rows={2}
                        value={formData.mitigation_plan}
                        onChange={handleInputChange}
                    />
                </div>

                {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Create risk'}
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
        </CollapsibleFormSection>
    );
};

const MultiCheckbox = ({ options, selected, onChange, labelKey = 'name' }) => {
    const toggle = (value) => {
        if (selected.includes(value)) {
            onChange(selected.filter((id) => id !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {options.map((option) => (
                <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                        type="checkbox"
                        checked={selected.includes(option.id)}
                        onChange={() => toggle(option.id)}
                    />
                    <span>
                        {option[labelKey] || option.name || option.code}
                        {option.code && (option[labelKey] || option.name) !== option.code ? ` (${option.code})` : ''}
                        {labelKey === 'reference_id' && option.name ? ` - ${option.name}` : ''}
                    </span>
                </label>
            ))}
            {options.length === 0 && <span style={{ color: '#64748b' }}>No options yet.</span>}
        </div>
    );
};

export default RiskForm;
