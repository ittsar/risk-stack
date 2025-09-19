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
  import-cprt <url>     Download CPRT JSON and import into backend
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
  ./go.bash import-cprt https://example.com/cprt.json
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
    import-cprt)
        if [ $# -lt 1 ]; then
            echo "Usage: ./go.bash import-cprt <url>" >&2
            echo "Optional environment variables: CPRT_FRAMEWORK_CODE, CPRT_FRAMEWORK_NAME, CPRT_FRAMEWORK_DESCRIPTION, CPRT_FILENAME" >&2
            exit 1
        fi
        url="$1"
        shift
        command -v curl >/dev/null 2>&1 || { echo "curl is required but was not found" >&2; exit 1; }
        framework_code="${CPRT_FRAMEWORK_CODE:-NIST-SP-800-53}"
        framework_name="${CPRT_FRAMEWORK_NAME:-NIST SP 800-53 Rev 5.2}"
        framework_description="${CPRT_FRAMEWORK_DESCRIPTION:-Security and Privacy Controls for Information Systems and Organizations.}"
        sanitized="${url%%\?*}"
        filename="${CPRT_FILENAME:-$(basename "${sanitized}")}"
        if [ -z "$filename" ] || [ "$filename" = "." ] || [ "$filename" = "/" ]; then
            filename="cprt_import.json"
        fi
        target_path="backend/$filename"
        echo "Downloading $url -> $target_path"
        curl -L "$url" -o "$target_path"
        docker compose run --rm backend python manage.py import_cprt_controls --file "/app/$filename" --framework-code "$framework_code" --framework-name "$framework_name" --framework-description "$framework_description"
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
