#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
VENV_DIR="${BACKEND_DIR}/.venv"

SKIP_TESTS=${SKIP_TESTS:-0}
START_SERVERS=${START_SERVERS:-0}
IMPORT_CPRT=${IMPORT_CPRT_CONTROLS:-0}
SEED_DEMO=${SEED_DEMO_DATA:-0}
CPRT_FILE=${CPRT_FILE:-}
FRAMEWORK_CODE=${FRAMEWORK_CODE:-NIST-SP-800-53}
FRAMEWORK_NAME=${FRAMEWORK_NAME:-"NIST SP 800-53 Rev 5.2"}
FRAMEWORK_DESCRIPTION=${FRAMEWORK_DESCRIPTION:-"Security and Privacy Controls for Information Systems and Organizations."}

print_usage() {
    cat <<'TXT'
Usage: scripts/bootstrap.sh [options]

Options:
  --skip-tests                Skip backend and frontend test suites
  --start-servers             Launch Django and React dev servers when setup finishes
  --import-cprt-controls      Import CPRT framework controls after migrations
  --seed-demo-data            Run manage.py seed_demo_data after migrations
  --cprt-file <path>          Explicit path to a CPRT JSON export
  --framework-code <value>    Framework code to associate with imported controls
  --framework-name <value>    Framework display name
  --framework-description <value>
                              Framework description
  --help                      Show this message
TXT
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-tests)
            SKIP_TESTS=1
            shift
            ;;
        --start-servers)
            START_SERVERS=1
            shift
            ;;
        --import-cprt-controls)
            IMPORT_CPRT=1
            shift
            ;;
        --seed-demo-data)
            SEED_DEMO=1
            shift
            ;;
        --cprt-file)
            if [[ $# -lt 2 ]]; then
                echo "--cprt-file requires a value" >&2
                exit 1
            fi
            CPRT_FILE=$2
            shift 2
            ;;
        --framework-code)
            if [[ $# -lt 2 ]]; then
                echo "--framework-code requires a value" >&2
                exit 1
            fi
            FRAMEWORK_CODE=$2
            shift 2
            ;;
        --framework-name)
            if [[ $# -lt 2 ]]; then
                echo "--framework-name requires a value" >&2
                exit 1
            fi
            FRAMEWORK_NAME=$2
            shift 2
            ;;
        --framework-description)
            if [[ $# -lt 2 ]]; then
                echo "--framework-description requires a value" >&2
                exit 1
            fi
            FRAMEWORK_DESCRIPTION=$2
            shift 2
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            print_usage >&2
            exit 1
            ;;
    esac
done

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

if [[ ! -d "${BACKEND_DIR}" ]] || [[ ! -d "${FRONTEND_DIR}" ]]; then
    echo "Run this script from the repository root (where backend/ and frontend/ live)." >&2
    exit 1
fi

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

if [[ ! -d "${VENV_DIR}" ]]; then
    "${PYTHON_CMD}" -m venv "${VENV_DIR}"
fi

# shellcheck disable=SC1090
source "${VENV_DIR}/bin/activate"

pip install --upgrade pip
pip install -r "${BACKEND_DIR}/requirements.txt"

if [[ ! -f "${BACKEND_DIR}/.env" ]] && [[ -f "${BACKEND_DIR}/.env.example" ]]; then
    cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
fi

python "${BACKEND_DIR}/manage.py" migrate
if [[ "${SEED_DEMO}" != "0" ]]; then
    python "${BACKEND_DIR}/manage.py" seed_demo_data
fi
if [[ "${SKIP_TESTS}" != "1" ]]; then
    python "${BACKEND_DIR}/manage.py" test
fi

resolve_cprt_file() {
    local candidate=""

    if [[ -n "${CPRT_FILE}" ]]; then
        candidate="${CPRT_FILE}"
    else
        for path in cprt_SP_800_53*.json; do
            if [[ -f "${path}" ]]; then
                candidate="${path}"
                break
            fi
        done
    fi

    if [[ -z "${candidate}" ]]; then
        echo ""
        return
    fi

    if [[ ! -f "${candidate}" ]]; then
        echo "Specified CPRT file not found: ${candidate}" >&2
        exit 1
    fi

    python -c 'import os, sys; print(os.path.abspath(sys.argv[1]))' "${candidate}"
}

if [[ "${IMPORT_CPRT}" != "0" ]]; then
    DATASET_PATH=$(resolve_cprt_file)
    if [[ -z "${DATASET_PATH}" ]]; then
        echo "Warning: --import-cprt-controls requested but no dataset was found." >&2
    else
        echo "Importing framework controls from ${DATASET_PATH} ..."
        python "${BACKEND_DIR}/manage.py" import_cprt_controls \
            --file "${DATASET_PATH}" \
            --framework-code "${FRAMEWORK_CODE}" \
            --framework-name "${FRAMEWORK_NAME}" \
            --framework-description "${FRAMEWORK_DESCRIPTION}"
    fi
fi

ORIGINAL_DIR="$(pwd)"

cd "${FRONTEND_DIR}"
if [[ ! -f .env.local ]] && [[ -f .env.example ]]; then
    cp .env.example .env.local
fi
npm install
if [[ "${SKIP_TESTS}" != "1" ]]; then
    CI=1 npm test -- --watch=false --passWithNoTests
fi

cd "${ORIGINAL_DIR}"

if [[ "${START_SERVERS}" == "1" ]]; then
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
