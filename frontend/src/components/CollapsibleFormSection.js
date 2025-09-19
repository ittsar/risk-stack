import React from 'react';

const CollapsibleFormSection = ({
    title,
    collapsed = false,
    toggleLabel,
    onToggle,
    children,
}) => {
    const showToggle = typeof collapsed === 'boolean' && typeof onToggle === 'function';
    const effectiveLabel = toggleLabel || (collapsed ? 'Expand' : 'Collapse');

    return (
        <div className="card">
            <div className="card-header">
                <h2>{title}</h2>
                {showToggle && (
                    <button
                        type="button"
                        className="card-toggle"
                        onClick={onToggle}
                    >
                        {effectiveLabel}
                    </button>
                )}
            </div>
            {(!showToggle || !collapsed) && children}
        </div>
    );
};

export default CollapsibleFormSection;
