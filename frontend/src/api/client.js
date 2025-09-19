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

export const apiRequest = async (
    endpoint,
    { method = 'GET', token, body, params, signal } = {}
) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers.Authorization = 'Token ' + token;
    }

    let url = API_BASE_URL + endpoint;
    if (params) {
        const query = new URLSearchParams(params).toString();
        if (query) {
            url = url + '?' + query;
        }
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    if (signal) {
        options.signal = signal;
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || response.statusText);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

export const apiBaseUrl = API_BASE_URL;
