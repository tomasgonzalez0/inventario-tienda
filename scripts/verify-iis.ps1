[CmdletBinding()]
param([int]$Port = 8081)

$ok = $true
$responses = @{}
foreach ($path in "/", "/docs/", "/health") {
    $url = "http://localhost:$Port$path"
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing
        $responses[$path] = $r
        Write-Host "OK   $($r.StatusCode) $url"
    } catch {
        Write-Host "FAIL $url - $($_.Exception.Message)"
        $ok = $false
    }
}

if ($responses["/"].Content -notmatch "Inventario Tienda") {
    Write-Host "FAIL La página principal no contiene el título esperado."
    $ok = $false
}

try {
    $health = $responses["/health"].Content | ConvertFrom-Json
    if ($health.status -ne "ok" -or $health.service -ne "inventario-tienda") {
        Write-Host "FAIL /health no devolvió el estado esperado."
        $ok = $false
    }
} catch {
    Write-Host "FAIL /health no devolvió JSON válido."
    $ok = $false
}

if (-not $ok) { exit 1 }
Write-Host "Validación IIS completada correctamente."
