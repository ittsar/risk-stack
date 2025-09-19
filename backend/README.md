# Backend Documentation

Django REST backend exposed from the `backend` directory.

## Quickstart
1. Create a virtual environment and activate it.
2. Install dependencies: `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` (or export the variables another way) and fill in the values.
4. Apply migrations: `python manage.py migrate`
5. Run the development server: `python manage.py runserver`

## Configuration
Environment variables the project understands:

| Variable | Purpose | Default |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Secret key for cryptographic signing | `change-me` |
| `DJANGO_DEBUG` | `True`/`False` toggle for debug mode | `True` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames | `localhost,127.0.0.1` |
| `DATABASE_URL` | PostgreSQL URL (`postgres://user:pass@host:port/db`) | *None* (uses SQLite) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins for the React app | `http://localhost:3000,http://127.0.0.1:3000` |
| `CSRF_TRUSTED_ORIGINS` | Hosts allowed for CSRF-protected requests | `http://localhost:3000` |

If `DATABASE_URL` is not provided the project automatically falls back to SQLite (`db.sqlite3`).

## API surface
- `GET /api/health/` — Simple healthcheck returning service status and timestamp. Used by the React client to verify the backend connection.

## Running tests
```
python manage.py test
```

## Project layout
- `backend/` — Project settings, URL configuration, and WSGI entrypoint.
- `api/` — Lightweight app containing healthcheck views, URLs, and tests. Add new endpoints here or create additional Django apps when the project grows.
