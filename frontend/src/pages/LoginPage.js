import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const { token, setToken } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await apiRequest('/api/auth/token/', {
                method: 'POST',
                body: { username, password },
            });
            setToken(result.token);
        } catch (err) {
            setError('Login failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    if (token) {
        return <Redirect to="/dashboard" />;
    }

    return (
        <div className="login-card">
            <h1>Risk Stack Login</h1>
            <p>Sign in with your Django credentials to manage risks.</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    autoFocus
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>
                {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
            </form>
        </div>
    );
};

export default LoginPage;
