#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="backend"
VENV_DIR="${BACKEND_DIR}/.venv"

if [ ! -d "${BACKEND_DIR}" ]; then
    echo "Run this script from the repository root (where the backend/ directory lives)." >&2
    exit 1
fi

if [ ! -d "${VENV_DIR}" ]; then
    echo "Virtualenv not found at ${VENV_DIR}. Run scripts/bootstrap.sh first." >&2
    exit 1
fi

if [ $# -eq 0 ]; then
    echo "Usage: ./scripts/manage.sh <manage.py arguments>" >&2
    exit 1
fi

# shellcheck disable=SC1090
source "${VENV_DIR}/bin/activate"

python "${BACKEND_DIR}/manage.py" "$@"
