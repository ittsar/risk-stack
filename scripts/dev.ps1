param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path $scriptDir -Parent
Set-Location $repoRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'docker is required but was not found in PATH.'
}

function Show-Usage {
    @"
Usage: go.bat [command] [options]

Commands:
  docker-up (default)   docker compose up --build
  docker-down           docker compose down
  docker-logs           docker compose logs -f
  docker-ps             docker compose ps
  native-bootstrap      scripts\bootstrap.ps1 (additional args forwarded)
  native-run            scripts\run.ps1 (additional args forwarded)
  help                  Show this message

Other commands are passed directly to ``docker compose <command>``.
Examples:
  go.bat
  go.bat docker-up --detach
  go.bat docker-down --volumes
  go.bat native-bootstrap -SeedDemoData -ImportFrameworkControls
  go.bat native-run -SkipMigrate
"@
}

if (-not $Args -or $Args.Count -eq 0) {
    $command = 'docker-up'
    $remaining = @()
}
else {
    $command = $Args[0]
    if ($Args.Count -gt 1) {
        $remaining = $Args[1..($Args.Count - 1)]
    }
    else {
        $remaining = @()
    }
}

$commandLower = $command.ToLowerInvariant()

switch ($commandLower) {
    'help' { Show-Usage; exit 0 }
    '-h' { Show-Usage; exit 0 }
    '--help' { Show-Usage; exit 0 }
    'docker-up' { & docker compose up --build @remaining; break }
    'up' { & docker compose up --build @remaining; break }
    'docker' { & docker compose up --build @remaining; break }
    'docker-down' { & docker compose down @remaining; break }
    'down' { & docker compose down @remaining; break }
    'docker-logs' { & docker compose logs -f @remaining; break }
    'logs' { & docker compose logs -f @remaining; break }
    'docker-ps' { & docker compose ps @remaining; break }
    'ps' { & docker compose ps @remaining; break }
    'native-bootstrap' {
        & (Join-Path $scriptDir 'bootstrap.ps1') @remaining
        break
    }
    'native-run' {
        & (Join-Path $scriptDir 'run.ps1') @remaining
        break
    }
    default {
        & docker compose $command @remaining
    }
}
