import React, { useEffect, useMemo, useState } from 'react';

import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

const DEFAULT_DEBOUNCE = 250;
const DEFAULT_MIN_LENGTH = 2;

const DirectoryAutocomplete = ({
    id,
    label,
    value,
    onChange,
    placeholder = 'Start typing to search…',
    apiPath = '/api/users/suggestions/',
    minLength = DEFAULT_MIN_LENGTH,
    limit = 8,
    debounce = DEFAULT_DEBOUNCE,
    disabled = false,
}) => {
    const { token } = useAuth();
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        const term = searchTerm.trim();
        const shouldFetch =
            visible && token && !disabled && term.length >= minLength;

        if (!shouldFetch) {
            setSuggestions([]);
            return undefined;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            try {
                const response = await apiRequest(apiPath, {
                    token,
                    params: { q: term, limit },
                    signal: controller.signal,
                });
                const results = response.results ?? response;
                setSuggestions(results);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setSuggestions([]);
                }
            }
        }, debounce);

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [apiPath, debounce, limit, minLength, searchTerm, token, visible, disabled]);

    const handleInputChange = (event) => {
        const newValue = event.target.value;
        setSearchTerm(newValue);
        onChange?.(newValue);
        if (!visible) {
            setVisible(true);
        }
    };

    const handleSuggestionSelect = (suggestion) => {
        const display = suggestion.display_name || suggestion.username;
        setSearchTerm(display);
        onChange?.(display);
        setSuggestions([]);
        setVisible(false);
    };

    const hasSuggestions = useMemo(() => suggestions.length > 0, [suggestions.length]);

    return (
        <div style={{ display: 'grid', gap: '8px' }}>
            {label && (
                <label htmlFor={id}>
                    {label}
                </label>
            )}
            <div className="autocomplete-wrapper">
                <input
                    id={id}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (hasSuggestions) {
                            setVisible(true);
                        }
                    }}
                    onBlur={() => setTimeout(() => setVisible(false), 150)}
                    placeholder={placeholder}
                    autoComplete="off"
                    disabled={disabled}
                />
                {visible && hasSuggestions && (
                    <div className="autocomplete-panel">
                        {suggestions.map((suggestion) => (
                            <button
                                type="button"
                                key={`${suggestion.source}-${suggestion.username}`}
                                className="autocomplete-item"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleSuggestionSelect(suggestion)}
                            >
                                <span className="autocomplete-primary">
                                    {suggestion.display_name || suggestion.username}
                                </span>
                                {suggestion.email && (
                                    <span className="autocomplete-secondary">{suggestion.email}</span>
                                )}
                                <span className="autocomplete-source">{suggestion.source}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DirectoryAutocomplete;
