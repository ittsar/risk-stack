param(
    [switch]$SkipMigrate
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Path $scriptDir -Parent
Set-Location $repoRoot

$backendDir = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'frontend'
$venvPath = Join-Path $backendDir '.venv'
$venvPython = Join-Path $venvPath 'Scripts/python.exe'

if (-not (Test-Path $backendDir) -or -not (Test-Path $frontendDir)) {
    throw 'Run this script from the repository root (where backend/ and frontend/ live).'
}

if (-not (Test-Path $venvPython)) {
    throw 'Virtualenv not found. Run scripts/bootstrap.ps1 first.'
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm is required but was not found in PATH.'
}

if (-not $SkipMigrate) {
    & $venvPython (Join-Path $backendDir 'manage.py') migrate --noinput
}

Write-Host 'Starting Django development server...'
$backendProcess = Start-Process -FilePath $venvPython -ArgumentList (Join-Path $backendDir 'manage.py'), 'runserver', '0.0.0.0:8000' -PassThru -NoNewWindow

try {
    Write-Host 'Starting React development server...'
    Push-Location $frontendDir
    $originalNodeOptions = $env:NODE_OPTIONS
    if (-not $originalNodeOptions) {
        $env:NODE_OPTIONS = '--openssl-legacy-provider'
    }
    elseif ($originalNodeOptions -notmatch '--openssl-legacy-provider') {
        $env:NODE_OPTIONS = "--openssl-legacy-provider $originalNodeOptions"
    }

    try {
        npm start
    }
    finally {
        if ($null -eq $originalNodeOptions -or $originalNodeOptions -eq '') {
            $env:NODE_OPTIONS = $null
        }
        else {
            $env:NODE_OPTIONS = $originalNodeOptions
        }
    }
}
finally {
    Pop-Location

    if ($backendProcess -and -not $backendProcess.HasExited) {
        Write-Host 'Stopping Django development server...'
        $backendProcess.CloseMainWindow() | Out-Null
        Start-Sleep -Seconds 2
        if (-not $backendProcess.HasExited) {
            $backendProcess.Kill()
        }
    }
}
