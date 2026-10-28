param(
  [string]$ResourceGroup = "rg-inventario-tienda-p3",
  [string]$PlanName = "asp-inventario-tienda-p3",
  [Parameter(Mandatory = $true)]
  [ValidatePattern("^[a-z0-9-]{2,60}$")]
  [string]$AppName,
  [string]$Location = "brazilsouth",
  [ValidateSet("F1", "B1")]
  [string]$Sku = "F1"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
  $defaultAzureCli = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin"
  if (Test-Path -LiteralPath (Join-Path $defaultAzureCli "az.cmd")) {
    $env:PATH = "$defaultAzureCli;$env:PATH"
  } else {
    throw "Azure CLI no está disponible. Abra una terminal nueva después de instalarlo."
  }
}

$account = az account show --query "{name:name,state:state}" --output json | ConvertFrom-Json
if ($account.state -ne "Enabled") {
  throw "La suscripción activa no está habilitada."
}

$runtimeConfig = az webapp list-runtimes --os linux --query "[?config=='NODE|24-lts'].config | [0]" --output tsv
$runtime = "NODE:24-lts"
if (-not $runtimeConfig) {
  $runtimeConfig = az webapp list-runtimes --os linux --query "[?config=='NODE|22-lts'].config | [0]" --output tsv
  $runtime = "NODE:22-lts"
}
if (-not $runtimeConfig) {
  throw "No se encontró un runtime compatible de Node.js 22 o 24 LTS."
}

Write-Host "Creando o actualizando recursos en $Location..."
$groupExists = az group exists --name $ResourceGroup --output tsv
if ($groupExists -ne "true") {
  az group create --name $ResourceGroup --location $Location --output none
}

$planExists = az appservice plan list --resource-group $ResourceGroup --query "[?name=='$PlanName'] | length(@)" --output tsv
if ($planExists -eq "0") {
  az appservice plan create --name $PlanName --resource-group $ResourceGroup --location $Location --sku $Sku --is-linux --output none
}

$appExists = az webapp list --resource-group $ResourceGroup --query "[?name=='$AppName'] | length(@)" --output tsv
if ($appExists -eq "0") {
  az webapp create --name $AppName --resource-group $ResourceGroup --plan $PlanName --runtime $runtime --output none
}

az webapp config set --name $AppName --resource-group $ResourceGroup --startup-file "npm start" --output none
az webapp config appsettings set --name $AppName --resource-group $ResourceGroup --settings NODE_ENV=production APP_NAME="Inventario Tienda" SCM_DO_BUILD_DURING_DEPLOYMENT=true --output none
az webapp update --name $AppName --resource-group $ResourceGroup --https-only true --output none

$projectRoot = Split-Path -Parent $PSScriptRoot
$releasePath = Join-Path $projectRoot "release.zip"
$stagingPath = Join-Path ([IO.Path]::GetTempPath()) "inventario-tienda-release"

if (Test-Path -LiteralPath $stagingPath) {
  [IO.Directory]::Delete($stagingPath, $true)
}
[IO.Directory]::CreateDirectory($stagingPath) | Out-Null

foreach ($item in "package.json", "package-lock.json", "openapi.yaml", "src", "public") {
  Copy-Item -LiteralPath (Join-Path $projectRoot $item) -Destination $stagingPath -Recurse
}

if (Test-Path -LiteralPath $releasePath) {
  [IO.File]::Delete($releasePath)
}
Compress-Archive -Path (Join-Path $stagingPath "*") -DestinationPath $releasePath -CompressionLevel Optimal

Write-Host "Publicando $AppName..."
az webapp deploy --name $AppName --resource-group $ResourceGroup --src-path $releasePath --type zip --clean true --restart true --output none

$url = "https://$AppName.azurewebsites.net"
Write-Host "Despliegue completado: $url"
Write-Host "Health check: $url/health"

