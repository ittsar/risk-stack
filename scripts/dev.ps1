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
  import-cprt           Download CPRT JSON and import into backend
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
  go.bat import-cprt https://example.com/cprt.json
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
    'import-cprt' {
        if (-not $remaining -or $remaining.Count -lt 1) {
            Write-Error 'Usage: go.bat import-cprt <url>'
            Write-Host 'Optional env: CPRT_FRAMEWORK_CODE, CPRT_FRAMEWORK_NAME, CPRT_FRAMEWORK_DESCRIPTION, CPRT_FILENAME'
            exit 1
        }
        $url = $remaining[0]
        $frameworkCode = if ($env:CPRT_FRAMEWORK_CODE) { $env:CPRT_FRAMEWORK_CODE } else { 'NIST-SP-800-53' }
        $frameworkName = if ($env:CPRT_FRAMEWORK_NAME) { $env:CPRT_FRAMEWORK_NAME } else { 'NIST SP 800-53 Rev 5.2' }
        $frameworkDescription = if ($env:CPRT_FRAMEWORK_DESCRIPTION) { $env:CPRT_FRAMEWORK_DESCRIPTION } else { 'Security and Privacy Controls for Information Systems and Organizations.' }
        $sanitized = ($url -split '\?')[0]
        $filename = if ($env:CPRT_FILENAME) { $env:CPRT_FILENAME } else { [System.IO.Path]::GetFileName($sanitized) }
        if ([string]::IsNullOrWhiteSpace($filename)) { $filename = 'cprt_import.json' }
        $targetPath = Join-Path $repoRoot (Join-Path 'backend' $filename)
        Write-Host "Downloading $url -> $targetPath"
        Invoke-WebRequest -Uri $url -OutFile $targetPath
        & docker compose run --rm backend python manage.py import_cprt_controls --file "/app/$filename" --framework-code $frameworkCode --framework-name $frameworkName --framework-description $frameworkDescription
        break
    }
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
