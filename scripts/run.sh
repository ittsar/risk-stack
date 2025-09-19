#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
VENV_DIR="${BACKEND_DIR}/.venv"
SKIP_MIGRATE="${SKIP_MIGRATE:-0}"

if [ ! -d "${BACKEND_DIR}" ] || [ ! -d "${FRONTEND_DIR}" ]; then
    echo "Run this script from the repository root (where backend/ and frontend/ live)." >&2
    exit 1
fi

if [ ! -d "${VENV_DIR}" ]; then
    echo "Virtualenv not found at ${VENV_DIR}. Run scripts/bootstrap.sh first." >&2
    exit 1
fi

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

if ! command_exists npm; then
    echo "npm is required but was not found" >&2
    exit 1
fi

# shellcheck disable=SC1090
source "${VENV_DIR}/bin/activate"

if [ "${SKIP_MIGRATE}" != "1" ]; then
    python "${BACKEND_DIR}/manage.py" migrate --noinput
fi
python "${BACKEND_DIR}/manage.py" runserver 0.0.0.0:8000 &
BACKEND_PID=$!

cleanup() {
    if kill -0 "${BACKEND_PID}" >/dev/null 2>&1; then
        kill "${BACKEND_PID}" >/dev/null 2>&1 || true
    fi
}

trap cleanup EXIT INT TERM

cd "${FRONTEND_DIR}"
# Ensure webpack works with newer Node versions
ORIGINAL_NODE_OPTIONS="${NODE_OPTIONS-}"
if [ -z "${NODE_OPTIONS:-}" ]; then
    export NODE_OPTIONS="--openssl-legacy-provider"
elif ! printf '%s' "$NODE_OPTIONS" | grep -q "--openssl-legacy-provider"; then
    export NODE_OPTIONS="--openssl-legacy-provider ${NODE_OPTIONS}"
fi

npm start

if [ -z "${ORIGINAL_NODE_OPTIONS}" ]; then
    unset NODE_OPTIONS
else
    export NODE_OPTIONS="${ORIGINAL_NODE_OPTIONS}"
fi
