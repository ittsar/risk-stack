import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome heading', () => {
    render(<App />);
    expect(screen.getByText(/welcome to risk stack/i)).toBeInTheDocument();
});
