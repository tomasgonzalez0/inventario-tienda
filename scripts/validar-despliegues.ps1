#Requires -Version 5.1
# Valida un despliegue de Inventario Tienda (Node local, IIS o Azure) a partir de su URL base.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BaseUrl,
    [switch]$SoloLectura,
    [int]$TimeoutSec = 30
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$BaseUrl = $BaseUrl.TrimEnd("/")
$resultados = New-Object System.Collections.Generic.List[object]

function Invoke-Comprobacion {
    param(
        [string]$Metodo,
        [string]$Ruta,
        [int]$Esperado,
        [scriptblock]$Validar,
        [hashtable]$Cuerpo
    )

    $resultado = [pscustomobject]@{
        Metodo    = $Metodo
        Ruta      = $Ruta
        Esperado  = $Esperado
        Obtenido  = $null
        Ms        = $null
        Resultado = "FALLA"
        Detalle   = ""
    }
    $resultados.Add($resultado)

    $parametros = @{ Uri = "$BaseUrl$Ruta"; Method = $Metodo; UseBasicParsing = $true; TimeoutSec = $TimeoutSec }
    if ($Cuerpo) {
        $parametros.ContentType = "application/json; charset=utf-8"
        $parametros.Body = [Text.Encoding]::UTF8.GetBytes(($Cuerpo | ConvertTo-Json))
    }

    $reloj = [Diagnostics.Stopwatch]::StartNew()
    try {
        $respuesta = Invoke-WebRequest @parametros
    } catch {
        $resultado.Ms = $reloj.ElapsedMilliseconds
        if ($_.Exception.Response) {
            $resultado.Obtenido = [int]$_.Exception.Response.StatusCode
            $resultado.Detalle = "Se esperaba HTTP $Esperado"
        } else {
            $resultado.Detalle = $_.Exception.Message
        }
        return $null
    }
    $resultado.Ms = $reloj.ElapsedMilliseconds
    $resultado.Obtenido = [int]$respuesta.StatusCode

    if ($resultado.Obtenido -ne $Esperado) {
        $resultado.Detalle = "Se esperaba HTTP $Esperado"
        return $null
    }
    if ($Validar) {
        try {
            $problema = & $Validar $respuesta
        } catch {
            $problema = $_.Exception.Message
        }
        if ($problema) {
            $resultado.Detalle = $problema
            return $null
        }
    }

    $resultado.Resultado = "OK"
    return $respuesta
}

Write-Host "Validando despliegue en $BaseUrl"

Invoke-Comprobacion "GET" "/" 200 {
    param($r)
    if ("$($r.Headers['Content-Type'])" -notlike "*html*") { return "No devuelve HTML" }
    if ($r.Content -notmatch "Inventario Tienda") { return "No contiene 'Inventario Tienda'" }
} | Out-Null

Invoke-Comprobacion "GET" "/health" 200 {
    param($r)
    $salud = $r.Content | ConvertFrom-Json
    if ($salud.status -ne "ok") { return "status distinto de 'ok'" }
    if ($salud.service -ne "inventario-tienda") { return "service distinto de 'inventario-tienda'" }
} | Out-Null

Invoke-Comprobacion "GET" "/docs" 200 {
    param($r)
    if ("$($r.Headers['Content-Type'])" -notlike "*html*") { return "Swagger no devuelve HTML" }
} | Out-Null

Invoke-Comprobacion "GET" "/api/products" 200 {
    param($r)
    $r.Content | ConvertFrom-Json | Out-Null
    if (-not $r.Content.TrimStart().StartsWith("[")) { return "No devuelve un arreglo JSON" }
} | Out-Null

if (-not $SoloLectura) {
    $producto = @{
        sku         = "SMK-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
        name        = "Producto de validación"
        description = "Creado y eliminado automáticamente por validar-despliegues.ps1"
        price       = 1000
        stock       = 1
    }
    $creado = Invoke-Comprobacion "POST" "/api/products" 201 {
        param($r)
        if (-not $r.Headers["Location"]) { return "Falta la cabecera Location" }
        if (-not ($r.Content | ConvertFrom-Json).id) { return "La respuesta no incluye id" }
    } -Cuerpo $producto

    if ($creado) {
        $id = ($creado.Content | ConvertFrom-Json).id
        Invoke-Comprobacion "DELETE" "/api/products/$id" 204 | Out-Null
    }
}

if ($BaseUrl -like "https://*") {
    $resultado = [pscustomobject]@{
        Metodo    = "GET"
        Ruta      = "http:// -> https://"
        Esperado  = 301
        Obtenido  = $null
        Ms        = $null
        Resultado = "FALLA"
        Detalle   = ""
    }
    $resultados.Add($resultado)

    $peticion = [Net.HttpWebRequest]::Create("http://$($BaseUrl.Substring(8))/")
    $peticion.AllowAutoRedirect = $false
    $peticion.Timeout = $TimeoutSec * 1000
    $reloj = [Diagnostics.Stopwatch]::StartNew()
    try {
        $respuesta = $peticion.GetResponse()
    } catch [Net.WebException] {
        $respuesta = $_.Exception.Response
    }
    $resultado.Ms = $reloj.ElapsedMilliseconds

    if ($respuesta) {
        $resultado.Obtenido = [int]$respuesta.StatusCode
        $destino = $respuesta.Headers["Location"]
        $respuesta.Close()
        if ($resultado.Obtenido -ge 300 -and $resultado.Obtenido -lt 400 -and $destino -like "https://*") {
            $resultado.Resultado = "OK"
        } else {
            $resultado.Detalle = "HTTP no redirige a HTTPS"
        }
    } else {
        $resultado.Detalle = "Sin respuesta por HTTP"
    }
}

$resultados | Format-Table -AutoSize | Out-String -Width 200 | Write-Host

if ($resultados | Where-Object { $_.Resultado -ne "OK" }) {
    Write-Host "Resultado global: FALLA"
    exit 1
}
Write-Host "Resultado global: OK"
exit 0
