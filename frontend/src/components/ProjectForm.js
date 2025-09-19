import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import DirectoryAutocomplete from './DirectoryAutocomplete';
import CollapsibleFormSection from './CollapsibleFormSection';

const initialState = {
    name: '',
    description: '',
    owner: '',
    status: 'planning',
    start_date: '',
    target_end_date: '',
};

const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'closed', label: 'Closed' },
];

const ProjectForm = ({
    onSuccess,
    mode = 'create',
    project = null,
    onCancel,
    isCollapsed,
    setIsCollapsed,
}) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState(initialState);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && project) {
            setFormData({
                name: project.name || '',
                description: project.description || '',
                owner: project.owner || '',
                status: project.status || 'planning',
                start_date: project.start_date || '',
                target_end_date: project.target_end_date || '',
            });
        } else {
            setFormData(initialState);
        }
    }, [mode, project]);

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
                start_date: formData.start_date || null,
                target_end_date: formData.target_end_date || null,
            };

            try {
                if (mode === 'edit' && project) {
                    await apiRequest(`/api/projects/${project.id}/`, {
                        method: 'PATCH',
                        token,
                        body: payload,
                    });
                    onSuccess?.();
                    onCancel?.();
                } else {
                    await apiRequest('/api/projects/', {
                        method: 'POST',
                        token,
                        body: payload,
                    });
                    setFormData(initialState);
                    onSuccess?.();
                    setIsCollapsed?.(true);
                }
            } catch (err) {
                setError('Failed to save project. Check the form and try again.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [formData, mode, project, token, onSuccess, onCancel, setIsCollapsed]
    );

    const collapsed = typeof isCollapsed === 'boolean' ? isCollapsed : false;
    const heading = mode === 'edit' && project ? `Edit Project - ${project.name}` : mode === 'edit' ? 'Edit Project' : 'Create New Project';
    const toggleLabel = collapsed
        ? (mode === 'edit' ? 'Expand editor' : 'New project')
        : 'Collapse';
    const handleToggle = typeof isCollapsed === 'boolean' && setIsCollapsed ? () => setIsCollapsed((prev) => !prev) : undefined;

    return (
        <CollapsibleFormSection
            title={heading}
            collapsed={collapsed}
            toggleLabel={toggleLabel}
            onToggle={handleToggle}
        >
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                    <label htmlFor={`project-name-${mode}`}>Name</label>
                    <input
                        id={`project-name-${mode}`}
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label htmlFor={`project-description-${mode}`}>Description</label>
                    <textarea
                        id={`project-description-${mode}`}
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                    />
                </div>

                <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <DirectoryAutocomplete
                        id={`project-owner-${mode}-${project?.id ?? 'new'}`}
                        label="Owner"
                        value={formData.owner}
                        onChange={(newValue) => setFormData((prev) => ({ ...prev, owner: newValue }))}
                        placeholder="Owner name or username"
                    />
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <label htmlFor={`project-status-${mode}`}>Status</label>
                        <select
                            id={`project-status-${mode}`}
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                        >
                            {statusOptions.map((option) => (
                                <option value={option.value} key={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <label htmlFor={`project-start-${mode}`}>Start Date</label>
                        <input
                            id={`project-start-${mode}`}
                            name="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        <label htmlFor={`project-target-${mode}`}>Target End Date</label>
                        <input
                            id={`project-target-${mode}`}
                            name="target_end_date"
                            type="date"
                            value={formData.target_end_date}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Create project'}
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

export default ProjectForm;
