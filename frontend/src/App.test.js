import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from './App';

test('shows login page when no token is present', () => {
    window.localStorage.clear();
    render(<App />);
    expect(screen.getByText(/risk stack login/i)).toBeInTheDocument();
});
