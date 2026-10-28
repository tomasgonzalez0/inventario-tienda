#Requires -Version 5.1
# Inicia el backend Node en modo producción en 127.0.0.1:3001.
[CmdletBinding()]
param(
    [int]$Port = 3001,
    [string]$BindHost = "127.0.0.1"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js no está instalado o no está en el PATH."
}

if (-not (Test-Path (Join-Path $root "node_modules"))) {
    npm ci --omit=dev
    if ($LASTEXITCODE -ne 0) { throw "npm ci falló." }
}

$env:NODE_ENV = "production"
$env:PORT = "$Port"
$env:HOST = $BindHost

Write-Host "Iniciando backend en http://${BindHost}:$Port (NODE_ENV=production)"
node src/server.js
