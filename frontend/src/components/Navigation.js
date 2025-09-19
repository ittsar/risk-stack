import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
    const { setToken } = useAuth();
    const links = [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/risks', label: 'Risks' },
        { to: '/projects', label: 'Projects' },
        { to: '/assets', label: 'Assets' },
        { to: '/frameworks', label: 'Frameworks' },
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
            <button
                type="button"
                onClick={() => setToken(null)}
                style={{
                    marginTop: 'auto',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                }}
            >
                Log out
            </button>
        </nav>
    );
};

export default Navigation;
