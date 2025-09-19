param(
    [Parameter(Mandatory = $false, ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = 'Stop'

if (-not $Args -or $Args.Count -eq 0) {
    Write-Host "Usage: powershell -ExecutionPolicy Bypass -File scripts/manage.ps1 <manage.py arguments>" -ForegroundColor Yellow
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Path $scriptDir -Parent
Set-Location $repoRoot

$backendDir = Join-Path $repoRoot 'backend'
$venvPath = Join-Path $backendDir '.venv'
$venvPython = Join-Path $venvPath 'Scripts/python.exe'

if (-not (Test-Path $backendDir)) {
    throw 'Run this script from the repository root (where backend/ lives).'
}

if (-not (Test-Path $venvPython)) {
    throw 'Virtualenv not found. Run scripts/bootstrap.ps1 first.'
}

& $venvPython (Join-Path $backendDir 'manage.py') @Args
