# Fullstack Application

Starter project for a Django REST backend and a React frontend that talk to each other out of the box.

## What's inside
- Django 4 project configured with Django REST Framework, CORS headers, and a healthcheck endpoint at `/api/health/`.
- Environment-aware settings that fall back to SQLite locally and allow switching to PostgreSQL via `DATABASE_URL`.
- React 17 app (Create React App) with React Router and a sample component that calls the backend and renders the response.

## Project structure

```
.
├── .gitignore
├── README.md
├── backend
│   ├── .env.example
│   ├── manage.py
│   ├── requirements.txt
│   ├── api
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   └── backend
│       ├── __init__.py
│       ├── settings.py
│       ├── urls.py
│       └── wsgi.py
└── frontend
    ├── .env.example
    ├── package.json
    └── src
        ├── App.js
        ├── index.js
        └── components
            └── ExampleComponent.js
```

## Prerequisites
- Python 3.9+
- Node.js 14+ (or the latest LTS) and npm
- PostgreSQL (optional, only if you set `DATABASE_URL`)

## Quick bootstrap
- Linux/macOS: `./scripts/bootstrap.sh`
- Windows (PowerShell): `powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1`

Both scripts install backend/frontend dependencies, create local `.env` files from the examples, run database migrations, and execute the test suites. Use `scripts/bootstrap.ps1 -SkipTests` or `SKIP_TESTS=1 ./scripts/bootstrap.sh` if you want to skip automated tests.

After the frontend install you can review dependency advisories with `cd frontend && npm audit`.

To automatically launch the dev servers after setup use `START_SERVERS=1 ./scripts/bootstrap.sh` on Linux/macOS or add `-StartServers` when invoking the PowerShell script.

## Running the dev servers later
- Linux/macOS: `./scripts/run.sh`
- Windows (PowerShell): `powershell -ExecutionPolicy Bypass -File scripts/run.ps1`

Both commands ensure migrations are applied (skip with `SKIP_MIGRATE=1 ./scripts/run.sh` or `scripts/run.ps1 -SkipMigrate`) and then start Django and React together. Press `Ctrl+C` (bash) or stop the PowerShell session to terminate both processes. On newer Node versions the scripts automatically set `NODE_OPTIONS=--openssl-legacy-provider` so Webpack 4 (CRA v4) can start.

## Docker usage
1. Build and start everything: `docker compose up --build`
2. Access everything through Nginx at `http://localhost/` — requests to `/api` route to Django and the React dev server streams through the same origin. PostgreSQL remains available on port `5432` should you need direct access.
3. Environment variables are declared in `docker-compose.yml`. Override them via a `.env` file at the project root or by exporting variables before running compose.
4. Stop and remove containers: `docker compose down` (add `-v` to drop the PostgreSQL data volume).

The compose setup mounts the local `backend/` and `frontend/` directories for live reload, so code edits on the host refresh inside the running containers.

## Backend setup
1. `cd backend`
2. *(Recommended)* Create and activate a virtual environment.
3. `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` (or export the variables another way) and update the values.
5. Apply migrations: `python manage.py migrate`
6. Run the server: `python manage.py runserver`

The backend defaults to SQLite. If `DATABASE_URL` is set it will connect to PostgreSQL instead.

## Frontend setup
1. `cd frontend`
2. Copy `.env.example` to `.env.local` (optional). Leave `REACT_APP_API_BASE_URL` blank—the React app automatically falls back to the page origin—or set it to a specific URL if you need to call the backend directly.
3. Install dependencies: `npm install`
4. Start the dev server: `npm start`

The React app reads `REACT_APP_API_BASE_URL` to know where to call the backend. By default it targets `http://localhost:8000`.

## Verifying the stack
1. Start the Django server on port 8000.
2. Start the React dev server on port 3000.
3. Visit `http://localhost:3000` — the home page will call `/api/health/` and display the JSON payload when the backend is reachable.

## Testing
- Backend: `cd backend && python manage.py test`
- Frontend: `cd frontend && npm test`

## Contributing
Pull requests and issue reports are welcome — feel free to open a discussion for larger changes before submitting a PR.
