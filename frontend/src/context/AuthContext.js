import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({ token: null, setToken: () => {} });

export const AuthProvider = ({ children }) => {
    const [token, setTokenState] = useState(() => localStorage.getItem('riskstack_token'));

    useEffect(() => {
        if (token) {
            localStorage.setItem('riskstack_token', token);
        } else {
            localStorage.removeItem('riskstack_token');
        }
    }, [token]);

    const setToken = (value) => {
        setTokenState(value);
    };

    return (
        <AuthContext.Provider value={{ token, setToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
