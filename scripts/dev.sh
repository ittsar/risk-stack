#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "$REPO_ROOT"

command -v "docker" >/dev/null 2>&1 || { echo "docker is required but was not found" >&2; exit 1; }

usage() {
    cat <<'TXT'
Usage: ./go.bash [command] [options]

Commands:
  docker-up (default)   Run `docker compose up --build`
  docker-down           Run `docker compose down`
  docker-logs           Tail docker compose logs (`-f`)
  docker-ps             Show running compose services
  native-bootstrap      Invoke scripts/bootstrap.sh (pass additional args)
  native-run            Invoke scripts/run.sh (pass additional args)
  help                  Show this message

Any other command is passed through to `docker compose <command>`.
Examples:
  ./go.bash             # same as docker-up
  ./go.bash docker-up --detach
  ./go.bash docker-down --volumes
  ./go.bash native-bootstrap --seed-demo-data --import-cprt-controls
  ./go.bash native-run --skip-migrate
TXT
}

if [ $# -eq 0 ]; then
    command="docker-up"
else
    command="$1"
    shift
fi

case "$command" in
    help|-h|--help)
        usage
        ;;
    docker-up|up|docker)
        docker compose up --build "$@"
        ;;
    docker-down|down)
        docker compose down "$@"
        ;;
    docker-logs|logs)
        docker compose logs -f "$@"
        ;;
    docker-ps|ps)
        docker compose ps "$@"
        ;;
    native-bootstrap)
        "$SCRIPT_DIR/bootstrap.sh" "$@"
        ;;
    native-run)
        "$SCRIPT_DIR/run.sh" "$@"
        ;;
    *)
        docker compose "$command" "$@"
        ;;
esac
