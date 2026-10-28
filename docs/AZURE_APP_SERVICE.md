# Publicación en Azure App Service

## Estado actual

La aplicación se encuentra publicada y operativa en Azure App Service.

- Aplicación: `inventario-tienda-itm-tomas-2026`.
- Resource Group: `rg-inventario-tienda-p3`.
- App Service Plan: `asp-inventario-tienda-p3`.
- Región: `Brazil South`.
- SKU: `F1 - Free`.
- Sistema: Linux.
- Runtime: Node.js 24 LTS.
- URL: <https://inventario-tienda-itm-tomas-2026.azurewebsites.net>.
- Health: <https://inventario-tienda-itm-tomas-2026.azurewebsites.net/health>.

## Configuración aplicada

Application Settings:

- `NODE_ENV=production`.
- `APP_NAME=Inventario Tienda`.
- `SCM_DO_BUILD_DURING_DEPLOYMENT=true`.

La opción HTTPS Only está habilitada. Las solicitudes HTTP son redirigidas a HTTPS.

## Resultado de la validación

| Verificación | Resultado |
|---|---|
| Página principal | HTTP 200 |
| Contenido del panel | Correcto |
| `/health` | HTTP 200, estado `ok` |
| `/docs` | HTTP 200 |
| `/api/products` | HTTP 200, dos productos iniciales |
| Redirección HTTP a HTTPS | HTTP 301 |
| Estado del Web App | Running |

## Repetir el despliegue

La cuenta responsable debe iniciar sesión de manera interactiva. No se comparten contraseñas, tokens ni códigos de autenticación.

```powershell
az login
.\scripts\deploy-azure.ps1 -AppName "inventario-tienda-itm-tomas-2026"
```

El script detecta el runtime compatible, crea o reutiliza los recursos, configura las variables, habilita HTTPS Only, genera el paquete ZIP y publica la aplicación.

## Evidencias que debe agregar Carla

Estas capturas constituyen su contribución individual y deben guardarse en `evidencias/azure/`:

1. `01-app-service-overview.png`: Overview mostrando nombre, estado y URL.
2. `02-application-settings.png`: nombres de las Application Settings, sin secretos.
3. `03-https-only.png`: opción HTTPS Only habilitada.
4. `04-aplicacion-publica.png`: panel funcionando en la URL HTTPS.
5. `05-health-publico.png`: respuesta de `/health`.

Después debe actualizar la tabla de responsabilidades del README con los nombres exactos de sus archivos, crear un commit desde su cuenta y abrir un Pull Request. Esto evita que la actividad de Azure quede atribuida únicamente al commit inicial de Tomás.
