# Risk Stack

Risk Stack is a starter kit pairing Django REST with a React frontend so you can stand up a full-stack app quickly.

## What's inside
- Django 4 project configured with Django REST Framework, token authentication, and a healthcheck endpoint at `/api/health/`.
- Rich risk domain models (projects, risks, assets, controls, findings, frameworks) with search, ordering, summaries, and OpenAPI docs.
- Seed command for demo data plus fixtures for core frameworks (NIST, ISO, PCI, HIPAA).
- React 17 app (Create React App) featuring dashboard widgets, risk/project/asset CRUD, inventories, and framework alignment views.

## Project structure

```
risk-stack
├── backend
│   ├── api/
│   ├── risk/
│   │   ├── fixtures/frameworks.json
│   │   ├── management/commands/seed_demo_data.py
│   │   ├── migrations/0001_initial.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   └── views.py
│   ├── backend/settings.py
│   └── backend/urls.py
├── docker-compose.yml
└── frontend
    ├── public/index.html
    ├── src/
│   ├── api/client.js
│   ├── components/AssetForm.js
│   ├── components/DirectoryAutocomplete.js
│   ├── components/Navigation.js
│   ├── components/ProjectForm.js
│   ├── components/RiskForm.js
    │   ├── context/AuthContext.js
    │   ├── pages/
    │   │   ├── AssetsPage.js
    │   │   ├── DashboardPage.js
    │   │   ├── FrameworksPage.js
    │   │   ├── LoginPage.js
    │   │   ├── ProjectsPage.js
    │   │   └── RisksPage.js
    │   ├── App.css
    │   └── App.js
    └── package.json
```

## Turn-key demo
Spin up the stack with the `go` helpers (docker compose first):

- Windows: `go.bat`
- macOS/Linux: `./go.bash`

Without arguments they run `docker compose up --build`. Examples:

- `./go.bash docker-down --volumes`
- `./go.bash docker-logs`
- `./go.bash native-bootstrap --seed-demo-data --import-cprt-controls`
- `./go.bash native-run --skip-migrate`

Use `go.bat help` or `./go.bash help` to list available commands.

## MVP features
- REST endpoints for frameworks, controls, projects, assets, risks, and findings with filtering, ordering, and summary analytics.
- Directory endpoint for user lookups to power owner assignment from existing Django users.
- Token-based authentication with auto-provisioned tokens for new users and OpenAPI documentation at `/api/openapi/` + `/api/docs/`.
- Dashboard metrics (projects, risks, findings, assets, controls, frameworks) and risk severity heatmap.
- Framework alignment view to map risks across NIST CSF, ISO/IEC 27001, PCI DSS, and HIPAA.
- Controls workspace for managing internal controls and mapping them to imported framework controls.
- Docker compose stack with Postgres and Nginx reverse proxy so the browser always talks to a single origin.

## Prerequisites
- Python 3.9+
- Node.js 14+ (or the latest LTS) and npm
- PostgreSQL (optional, only if you set `DATABASE_URL`)

## Quick bootstrap (optional native stack)
- Linux/macOS: `./go.bash native-bootstrap --seed-demo-data --import-cprt-controls`
- Windows (PowerShell): `go.bat native-bootstrap -SeedDemoData -ImportFrameworkControls`

These commands reuse the bootstrap script to install dependencies, create `.env` files, run migrations, and - when the flags above are provided - import CPRT identifiers and seed demo content. Add `--skip-tests` / `-SkipTests` to bypass automated tests, `--start-servers` / `-StartServers` to launch the native dev servers, and `--cprt-file` / `-CprtFile` to point at a specific dataset.

Prefer working directly with the scripts? Use `./scripts/bootstrap.sh` or `powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1` with the same flags.

After the frontend install you can review dependency advisories with `cd frontend && npm audit`.

## CPRT framework controls

To pull the latest NIST SP 800-53 CPRT export and load it into the backend (containerised):

```bash
curl -L "<DOWNLOAD_URL>" -o backend/cprt_SP_800_53_5_2_0_09-19-2025.json   && docker compose run --rm backend python manage.py import_cprt_controls        --file /app/cprt_SP_800_53_5_2_0_09-19-2025.json        --framework-code NIST-SP-800-53        --framework-name "NIST SP 800-53 Rev 5.2"        --framework-description "Security and Privacy Controls for Information Systems and Organizations."
```

Or use the helper command (defaults can be overridden with `CPRT_*` env vars):

```bash
./go.bash import-cprt <DOWNLOAD_URL>
```

```powershell
go.bat import-cprt <DOWNLOAD_URL>
```

The file is saved under `backend/` so the importer can read it via the compose volume mount.

## Demo data & credentials
Most workflows run this automatically (the `go` helpers and bootstrap scripts with `--seed-demo-data` / `-SeedDemoData`). Run it manually if you need to refresh the sample content.

1. `cd backend`
2. `python manage.py migrate`
3. `python manage.py seed_demo_data`

The seed command populates common frameworks (NIST CSF, ISO/IEC 27001, PCI DSS, HIPAA), a sample project, asset, control, risk, and finding, and ensures an admin account exists:

- Username: `riskadmin`
- Password: `RiskStack123!`
- API token is printed when the command finishes.

From Docker, run `docker compose exec backend python manage.py seed_demo_data` after the containers start.

## Running the dev servers later (native)
- Linux/macOS: `./go.bash native-run --skip-migrate`
- Windows (PowerShell): `go.bat native-run -SkipMigrate`

Drop the `--skip-migrate` / `-SkipMigrate` flag if you want the script to apply migrations first. Press `Ctrl+C` (bash) or stop the PowerShell session to terminate both processes. On newer Node versions the scripts automatically set `NODE_OPTIONS=--openssl-legacy-provider` so Webpack 4 (CRA v4) can start. Forward additional arguments to the React dev server by appending `--` (for example `./go.bash native-run -- --https`).

You can still run `./scripts/run.sh` or `scripts/run.ps1` directly if you prefer.

## Django management helper
- Linux/macOS: `./scripts/manage.sh migrate`, `./scripts/manage.sh createsuperuser`, etc.
- Windows (PowerShell): `powershell -ExecutionPolicy Bypass -File scripts/manage.ps1 migrate`

Both wrappers activate the project virtualenv so you can run any `manage.py` command without manually sourcing `.venv`.

## Docker usage
1. Build and start everything: `docker compose up --build`
2. Access everything through Nginx at `http://localhost/` — requests to `/api` route to Django and the React dev server streams through the same origin. PostgreSQL remains available on port `5432` should you need direct access.
3. Environment variables are declared in `docker-compose.yml`. Override them via a `.env` file at the project root or by exporting variables before running compose.
4. On startup the backend container automatically runs migrations and seeds common frameworks, demo data, and the default credentials:
   - Username: `riskadmin`
   - Password: `RiskStack123!`
   Check the backend logs for the generated API token if you need to call the API directly.
5. Stop and remove containers: `docker compose down` (add `-v` to drop the PostgreSQL data volume).

The compose setup mounts the local `backend/` and `frontend/` directories for live reload, so code edits on the host refresh inside the running containers.

## API authentication
Generate a token via the REST endpoint and send it on subsequent requests:

```
curl -X POST http://localhost/api/auth/token/ -d 'username=riskadmin&password=RiskStack123!'

# Example authorized request
curl http://localhost/api/risks/ -H 'Authorization: Token YOUR_TOKEN'
```

Tokens are automatically minted for newly created users (see `risk/signals.py`).

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

The React app reads `REACT_APP_API_BASE_URL` to know where to call the backend. If the variable is omitted, it automatically calls the same origin that served the bundle (useful when running behind the provided Nginx proxy).

## Verifying the stack
1. Start the Django dev server (`python manage.py runserver`) or `docker compose up --build`.
2. Run `python manage.py seed_demo_data` (or the docker equivalent) to create demo data and credentials.
3. Start the React dev server (`npm start`) if you are not using Docker.
4. Visit `http://localhost:3000` (dev servers) or `http://localhost/` (docker + nginx) and sign in with `riskadmin / RiskStack123!`.
5. Expand the "New risk" panel to create a risk, or click "Edit" on a row to update/delete. The dashboard metrics, risk severity heatmap, risk register table, and framework alignment view will refresh with demo data.

## Testing
- Backend: `cd backend && python manage.py test risk`
- Full backend suite: `cd backend && python manage.py test`
- Frontend: `cd frontend && npm test`

## Contributing
Pull requests and issue reports are welcome — feel free to open a discussion for larger changes before submitting a PR.
















