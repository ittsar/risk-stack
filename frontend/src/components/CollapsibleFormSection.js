import React from 'react';

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
};

const buttonStyle = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#2563eb',
};

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
            <div style={headerStyle}>
                <h2 style={{ margin: 0 }}>{title}</h2>
                {isCollapsible && (
                    <button type="button" style={buttonStyle} onClick={onToggle}>
                        {effectiveLabel}
                    </button>
                )}
            </div>
            {!isCollapsible || !collapsed ? children : null}
        </div>
    );
};

export default CollapsibleFormSection;
