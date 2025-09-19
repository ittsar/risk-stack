import React from 'react';

const CollapsibleFormSection = ({
    title,
    collapsed = false,
    toggleLabel,
    onToggle,
    children,
    className = '',
    style,
}) => {
    const isCollapsible = typeof onToggle === 'function';
    const effectiveLabel = toggleLabel ?? (collapsed ? 'Expand form' : 'Collapse');
    const rootClassName = ['card', className].filter(Boolean).join(' ');

    return (
        <div className={rootClassName} style={style}>
            <div className="card-header">
                <h2>{title}</h2>
                {isCollapsible && (
                    <button type="button" className="card-toggle" onClick={onToggle}>
                        {effectiveLabel}
                    </button>
                )}
            </div>
            {!isCollapsible || !collapsed ? children : null}
        </div>
    );
};

export default CollapsibleFormSection;
