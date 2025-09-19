import React, { useEffect, useState } from 'react';

const normalizeBaseUrl = (url) => {
    if (!url) {
        return '';
    }

    return url.endsWith('/') ? url.slice(0, -1) : url;
};

const resolveApiBaseUrl = () => {
    const envValue = process.env.REACT_APP_API_BASE_URL?.trim();
    if (envValue) {
        return normalizeBaseUrl(envValue);
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return normalizeBaseUrl(window.location.origin);
    }

    return '';
};

const API_BASE_URL = resolveApiBaseUrl();

const ExampleComponent = () => {
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchHealthcheck = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/health/`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Unexpected response: ${response.status}`);
                }

                const payload = await response.json();
                setStatus(payload);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message);
                }
            }
        };

        fetchHealthcheck();

        return () => controller.abort();
    }, []);

    if (error) {
        return (
            <div>
                <h1>Something went wrong</h1>
                <p>{error}</p>
            </div>
        );
    }

    if (!status) {
        return (
            <div>
                <h1>Checking backend status...</h1>
            </div>
        );
    }

    return (
        <div>
            <h1>Backend is online</h1>
            <p>{`Status: ${status.status}`}</p>
            <p>{`Service: ${status.service}`}</p>
            <p>{`Checked at: ${status.timestamp}`}</p>
        </div>
    );
};

export default ExampleComponent;
