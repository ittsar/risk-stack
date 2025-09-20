import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const UI_VERSION = process.env.REACT_APP_VERSION || 'dev';

const Navigation = () => {
    const { token, setToken } = useAuth();
    const [apiVersion, setApiVersion] = useState(null);
    const [versionError, setVersionError] = useState(null);

    useEffect(() => {
        if (!token) {
            setApiVersion(null);
            setVersionError(null);
            return undefined;
        }

        let isMounted = true;
        const controller = new AbortController();

        const loadVersion = async () => {
            try {
                const response = await apiRequest('/api/version/', {
                    token,
                    signal: controller.signal,
                });
                if (isMounted) {
                    setApiVersion(response);
                    setVersionError(null);
                }
            } catch (error) {
                if (!isMounted || error?.name === 'AbortError') {
                    return;
                }
                setVersionError('Unable to fetch API version');
            }
        };

        loadVersion();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [token]);

    const apiVersionLabel = useMemo(() => {
        if (!apiVersion?.backend) {
            return null;
        }
        const commit = apiVersion.commit ? apiVersion.commit.slice(0, 7) : null;
        return commit ? `API ${apiVersion.backend} (${commit})` : `API ${apiVersion.backend}`;
    }, [apiVersion]);

    const environmentLabel = apiVersion?.environment ? apiVersion.environment.toUpperCase() : null;

    const apiVersionDisplay = apiVersionLabel || 'API --';

    const links = [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/risks', label: 'Risks' },
        { to: '/projects', label: 'Projects' },
        { to: '/assets', label: 'Assets' },
        { to: '/controls', label: 'Controls' },
        { to: '/frameworks', label: 'Frameworks' },
        { to: '/vulnerabilities', label: 'Vulnerabilities' },
    ];

    return (
        <nav className="app-nav">
            <div className="app-logo">Risk Stack</div>
            <ul>
                {links.map((link) => (
                    <li key={link.to}>
                        <NavLink to={link.to} activeClassName="active">
                            {link.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
            <div className="nav-footer">
                <div className="nav-version">
                    <span>{`UI ${UI_VERSION}`}</span>
                    <span>{apiVersionDisplay}</span>
                    {environmentLabel && <span>{environmentLabel}</span>}
                    {versionError && <span className="nav-version-error">{versionError}</span>}
                </div>
                <button
                    type="button"
                    onClick={() => setToken(null)}
                    style={{
                        background: 'var(--color-surface-lighter)',
                        color: 'var(--color-heading)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: '0 12px 24px rgba(2, 8, 23, 0.35)',
                        cursor: 'pointer',
                    }}
                >
                    Log out
                </button>
            </div>
        </nav>
    );
};

export default Navigation;
