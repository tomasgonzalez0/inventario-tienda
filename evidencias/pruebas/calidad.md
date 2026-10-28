# Calidad - Inventario Tienda

Responsable: Samuel Cristóbal Cuello Duque
Fecha: 2026-10-27
Entorno: Windows 11 Pro, Node.js v24.13.0

| Comando | Resultado |
|---|---|
| `npm ci` | 125 paquetes instalados desde `package-lock.json`, 0 vulnerabilidades |
| `npm test` | 2 archivos, 15 pruebas aprobadas |
| `npm audit --omit=dev` | 0 vulnerabilidades (dependencias de producción) |
| `npm audit` | 0 vulnerabilidades (incluye dependencias de desarrollo) |

## Smoke test por entorno

| Entorno | URL base | Reporte | Resultado |
|---|---|---|---|
| Node local | http://localhost:3000 | [local.md](local.md) | OK |
| IIS | http://localhost:8081 | [03-validacion-iis-web.png](03-validacion-iis-web.png), [03-validacion-iis-health.png](03-validacion-iis-health.png) | OK: `/` 200 a través de ARR y `/health` con `status: ok`, `environment: production` |
| Azure App Service | https://inventario-tienda-itm-tomas-2026.azurewebsites.net | [azure.md](azure.md) | OK, incluida la redirección HTTP → HTTPS (301) |

Se comprueban los mismos endpoints en todos los entornos porque es el mismo código: si una ruta
responde en Node local pero no en IIS o Azure, el problema está en la publicación (proxy, puerto,
variables de entorno o HTTPS) y no en la aplicación.

Comandos utilizados:

```powershell
# Script PowerShell (página, /health, /docs, /api/products, POST 201 + limpieza y, en HTTPS, redirección HTTP)
.\scripts\validar-despliegues.ps1 -BaseUrl <URL base>
.\scripts\validar-despliegues.ps1 -BaseUrl <URL base> -SoloLectura   # sin crear productos

# Versión Node (genera el reporte Markdown y se prueba dentro de npm test)
npm run smoke -- <URL base> --report evidencias/pruebas/<entorno>.md
```

Los reportes solo contienen URLs públicas, códigos HTTP y tiempos; no incluyen tokens ni credenciales.
