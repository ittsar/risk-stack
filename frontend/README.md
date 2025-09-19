# Frontend Documentation

React single-page application bootstrapped with Create React App.

## Quickstart
1. Navigate to this directory: `cd frontend`
2. Copy `.env.example` to `.env.local` (optional). Leave `REACT_APP_API_BASE_URL` empty—the app will use its current origin—or set it to a full URL if needed.
3. Install dependencies: `npm install`
4. Run the development server: `npm start`
5. Log in with the demo credentials created by `python manage.py seed_demo_data` (`riskadmin / RiskStack123!`).

## Environment variables
Only variables prefixed with `REACT_APP_` are exposed to the browser.

| Variable | Purpose | Default |
| --- | --- | --- |
| `REACT_APP_API_BASE_URL` | Base URL for the Django backend | *(empty → same origin)* |

## API integration
`src/components/ExampleComponent.js` fetches `/api/health/` from the backend and renders the JSON payload so you can verify the round trip immediately after both servers start.

## Pages
- **Dashboard** – KPI cards, risk severity heatmap, and status breakdown.
- **Risks** – Searchable register with severity chips and framework tags.
- **Projects** – Active projects with status and timeline.
- **Assets** – Inventory of applications, infrastructure, vendors, etc.
- **Frameworks** – Filter risks by NIST, ISO, PCI, or HIPAA mappings.

## Available scripts
- `npm start` — runs the app in development mode at `http://localhost:3000`.
- `npm run build` — builds the app for production in the `build` folder.
- `npm test` — runs the interactive test runner.

Refer to the main `README.md` for instructions on running the frontend alongside the Django backend.
