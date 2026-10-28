# Publicación en IIS (proxy inverso)

IIS (puerto 8081) reenvía todo a Node en `127.0.0.1:3001` mediante URL Rewrite + ARR.

## Pasos (PowerShell como administrador)

```powershell
.\scripts\setup-iis.ps1          # IIS, URL Rewrite, ARR, proxy, pool y sitio
.\scripts\start-backend.ps1      # Node en producción, 127.0.0.1:3001
.\scripts\verify-iis.ps1         # prueba /, /docs y /health en :8081
```

`setup-iis.ps1` crea `InventarioTiendaPool` (No Managed Code, Integrated) y el sitio
`InventarioTienda` (ruta física `iis\proxy`, binding HTTP `*:8081`). Es idempotente:
si el sitio ya existe, actualiza su ruta, Application Pool y binding al puerto indicado.
Los instaladores de URL Rewrite y ARR se aceptan únicamente si su firma digital es válida.

Verificación manual: http://localhost:8081/ , http://localhost:8081/docs , http://localhost:8081/health

## Errores comunes y solución

| Error | Causa | Solución |
|---|---|---|
| 404.4 / 500.19 en `web.config` | URL Rewrite no instalado | Reinstalar con `setup-iis.ps1` y `iisreset` |
| 404 en el rewrite | Proxy de ARR deshabilitado | `appcmd set config -section:system.webServer/proxy /enabled:True /commit:apphost` |
| 502.3 Bad Gateway | Backend Node apagado o en otro puerto | Ejecutar `start-backend.ps1`; revisar `127.0.0.1:3001` |
| `Get-Service W3SVC` no existe | IIS no habilitado | Ejecutar el script como administrador |
| Puerto 8081 en uso | Otro proceso/sitio | `netstat -ano \| findstr :8081` y cambiar `-SitePort` |
| 403 en la carpeta | El pool no lee `iis\proxy` | `icacls` al `IIS AppPool\InventarioTiendaPool` (lo hace el script) |
| `/docs` redirige a `/docs/` | Comportamiento de swagger-ui | Usar `/docs/` en el script de verificación |

## Resultados

Los pasos de IIS requieren privilegios de administrador; completar aquí la evidencia
(capturas/video: App Pool, binding, sitio y aplicación local).
