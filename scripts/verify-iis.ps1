[CmdletBinding()]
param([int]$Port = 8081)

$ok = $true
foreach ($path in "/", "/docs/", "/health") {
    $url = "http://localhost:$Port$path"
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing
        Write-Host "OK   $($r.StatusCode) $url"
    } catch {
        Write-Host "FAIL $url - $($_.Exception.Message)"
        $ok = $false
    }
}
if (-not $ok) { exit 1 }
