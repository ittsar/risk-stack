param(
    [switch]$SkipTests,
    [switch]$StartServers
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Path $scriptDir -Parent
Set-Location $repoRoot

$backendDir = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'frontend'

if (-not (Test-Path $backendDir) -or -not (Test-Path $frontendDir)) {
    throw 'Run this script from the repository root (where backend/ and frontend/ live).'
}

function Resolve-PythonCommand {
    $candidates = @(
        @{ Path = 'py'; Args = @('-3') },
        @{ Path = 'python3'; Args = @() },
        @{ Path = 'python'; Args = @() }
    )

    foreach ($candidate in $candidates) {
        if (Get-Command $candidate.Path -ErrorAction SilentlyContinue) {
            return [PSCustomObject]@{
                Path = $candidate.Path
                Args = $candidate.Args
            }
        }
    }

    throw 'Python 3 is required but was not found in PATH.'
}

$pythonCommand = Resolve-PythonCommand
$venvPath = Join-Path $backendDir '.venv'

if (-not (Test-Path $venvPath)) {
    $venvArgs = @()
    if ($pythonCommand.Args) {
        $venvArgs += $pythonCommand.Args
    }
    $venvArgs += @('-m', 'venv', $venvPath)

    & $pythonCommand.Path @venvArgs
}

$venvPython = Join-Path $venvPath 'Scripts/python.exe'

& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $backendDir 'requirements.txt')

$envFile = Join-Path $backendDir '.env'
$envExample = Join-Path $backendDir '.env.example'
if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
    Copy-Item $envExample $envFile
}

& $venvPython (Join-Path $backendDir 'manage.py') migrate
if (-not $SkipTests) {
    & $venvPython (Join-Path $backendDir 'manage.py') test
}

Push-Location $frontendDir
try {
    if (-not (Test-Path '.env.local') -and (Test-Path '.env.example')) {
        Copy-Item '.env.example' '.env.local'
    }

    npm install

    if (-not $SkipTests) {
        $originalCI = $env:CI
        $env:CI = 'true'
        try {
            npm test -- --watch=false --passWithNoTests
        }
        finally {
            $env:CI = $originalCI
        }
    }
}
finally {
    Pop-Location
}

if ($StartServers) {
    Write-Host 'Starting Django development server...'
    $backendProcess = Start-Process -FilePath (Join-Path $venvPath 'Scripts/python.exe') -ArgumentList (Join-Path $backendDir 'manage.py'), 'runserver', '0.0.0.0:8000' -PassThru -NoNewWindow

    try {
        Write-Host 'Starting React development server...'
        Push-Location $frontendDir
        npm start
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
}

Write-Host ''
Write-Host 'Bootstrap complete!'
Write-Host ''
Write-Host 'Next steps:'
Write-Host '1. Activate the virtualenv: backend\.venv\Scripts\Activate.ps1'
Write-Host '2. Start Django: backend\.venv\Scripts\python.exe backend/manage.py runserver'
Write-Host '3. In another terminal: cd frontend; npm start'
