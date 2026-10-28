#Requires -Version 5.1
#Requires -RunAsAdministrator
# Configura IIS como proxy inverso hacia el backend Node. Idempotente.
[CmdletBinding()]
param(
    [string]$SiteName = "InventarioTienda",
    [string]$PoolName = "InventarioTiendaPool",
    [int]$SitePort = 8081
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$proxyPath = Join-Path $root "iis\proxy"
$appcmd = Join-Path $env:windir "System32\inetsrv\appcmd.exe"

function Assert-NativeSuccess([string]$Action) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Action falló con código $LASTEXITCODE."
    }
}

# 1. Habilitar IIS
$features = "IIS-WebServerRole", "IIS-WebServer", "IIS-CommonHttpFeatures", "IIS-StaticContent",
            "IIS-DefaultDocument", "IIS-HttpErrors", "IIS-RequestFiltering", "IIS-ManagementConsole"
foreach ($f in $features) {
    Enable-WindowsOptionalFeature -Online -FeatureName $f -All -NoRestart | Out-Null
}
Set-Service W3SVC -StartupType Automatic
if ((Get-Service W3SVC).Status -ne "Running") { Start-Service W3SVC }
Write-Host "W3SVC: $((Get-Service W3SVC).Status)"

# 2. Instalar URL Rewrite y ARR
function Install-Msi($Name, $Url) {
    $msi = Join-Path $env:TEMP "$Name.msi"
    Invoke-WebRequest -Uri $Url -OutFile $msi -UseBasicParsing
    $signature = Get-AuthenticodeSignature -FilePath $msi
    if ($signature.Status -ne "Valid") {
        throw "La firma digital del instalador $Name no es válida: $($signature.Status)."
    }
    $p = Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /qn /norestart" -Wait -PassThru
    if ($p.ExitCode -notin 0, 3010) { throw "Fallo instalando $Name (código $($p.ExitCode))." }
}
if (-not (Test-Path "$env:windir\System32\inetsrv\rewrite.dll")) {
    Install-Msi "rewrite_amd64_en-US" "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
}
if (-not (Test-Path "$env:ProgramFiles\IIS\Application Request Routing")) {
    Install-Msi "requestRouter_amd64" "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi"
}

# 3. Habilitar Proxy en ARR
& $appcmd set config -section:system.webServer/proxy /enabled:"True" /commit:apphost | Out-Null
Assert-NativeSuccess "Habilitar el proxy de ARR"

# 4. App Pool: No Managed Code + Integrated
& $appcmd list apppool $PoolName 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    & $appcmd add apppool /name:$PoolName | Out-Null
    Assert-NativeSuccess "Crear el Application Pool $PoolName"
}
& $appcmd set apppool $PoolName /managedRuntimeVersion:"" /managedPipelineMode:Integrated | Out-Null
Assert-NativeSuccess "Configurar el Application Pool $PoolName"

# 5. Sitio, ruta física, binding HTTP 8081
& $appcmd list site $SiteName 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    & $appcmd add site /name:$SiteName /physicalPath:"$proxyPath" /bindings:"http/*:${SitePort}:" | Out-Null
    Assert-NativeSuccess "Crear el sitio $SiteName"
} else {
    & $appcmd set vdir "$SiteName/" /physicalPath:"$proxyPath" | Out-Null
    Assert-NativeSuccess "Actualizar la ruta física de $SiteName"
    & $appcmd set site $SiteName /bindings:"http/*:${SitePort}:" | Out-Null
    Assert-NativeSuccess "Actualizar el binding de $SiteName"
}
& $appcmd set app "$SiteName/" /applicationPool:$PoolName | Out-Null
Assert-NativeSuccess "Asignar el Application Pool al sitio"

# El pool necesita leer la carpeta del proxy
icacls $proxyPath /grant "IIS AppPool\${PoolName}:(OI)(CI)RX" | Out-Null

if ((& $appcmd list site $SiteName) -notmatch "Started") {
    & $appcmd start site $SiteName | Out-Null
    Assert-NativeSuccess "Iniciar el sitio $SiteName"
}
iisreset | Out-Null
Assert-NativeSuccess "Reiniciar IIS"
Write-Host "Sitio $SiteName listo en http://localhost:$SitePort/. Inicie el backend con scripts\start-backend.ps1"
