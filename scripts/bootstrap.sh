#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
VENV_DIR="${BACKEND_DIR}/.venv"
SKIP_TESTS="${SKIP_TESTS:-0}"
START_SERVERS="${START_SERVERS:-0}"

if [ ! -d "${BACKEND_DIR}" ] || [ ! -d "${FRONTEND_DIR}" ]; then
    echo "Run this script from the repository root (where backend/ and frontend/ live)." >&2
    exit 1
fi

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

PYTHON_CMD="python3"
if ! command_exists "${PYTHON_CMD}"; then
    if command_exists python; then
        PYTHON_CMD="python"
    else
        echo "python3 (or python) is required but was not found" >&2
        exit 1
    fi
fi

if ! command_exists npm; then
    echo "npm is required but was not found" >&2
    exit 1
fi

if [ ! -d "${VENV_DIR}" ]; then
    "${PYTHON_CMD}" -m venv "${VENV_DIR}"
fi

# shellcheck disable=SC1090
source "${VENV_DIR}/bin/activate"

pip install --upgrade pip
pip install -r "${BACKEND_DIR}/requirements.txt"

if [ ! -f "${BACKEND_DIR}/.env" ] && [ -f "${BACKEND_DIR}/.env.example" ]; then
    cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
fi

python "${BACKEND_DIR}/manage.py" migrate
if [ "${SKIP_TESTS}" != "1" ]; then
    python "${BACKEND_DIR}/manage.py" test
fi

ORIGINAL_DIR="$(pwd)"

cd "${FRONTEND_DIR}"
if [ ! -f .env.local ] && [ -f .env.example ]; then
    cp .env.example .env.local
fi
npm install
if [ "${SKIP_TESTS}" != "1" ]; then
    CI=1 npm test -- --watch=false --passWithNoTests
fi

cd "${ORIGINAL_DIR}"

if [ "${START_SERVERS}" = "1" ]; then
    echo "Starting Django development server..."
    source "${VENV_DIR}/bin/activate"
    python "${BACKEND_DIR}/manage.py" runserver 0.0.0.0:8000 &
    BACKEND_PID=$!

    cleanup() {
        if kill -0 "${BACKEND_PID}" >/dev/null 2>&1; then
            kill "${BACKEND_PID}" >/dev/null 2>&1 || true
        fi
    }

    trap cleanup EXIT INT TERM

    cd "${FRONTEND_DIR}"
    echo "Starting React development server..."
    npm start
fi

cat <<'MSG'
Bootstrap complete!

To run the stack:
1. Activate the virtualenv: source backend/.venv/bin/activate
2. Start Django: python backend/manage.py runserver 0.0.0.0:8000
3. In another terminal, run frontend: cd frontend && npm start
MSG
