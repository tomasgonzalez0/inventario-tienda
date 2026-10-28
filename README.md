# Inventario Tienda

Aplicación web de inventario desarrollada con Node.js y Express. La solución incluye un panel web, una API REST documentada con OpenAPI y un endpoint de salud. El proyecto se publicará en IIS y Azure App Service como parte de la Práctica 3 de Despliegue de Software.

## Integrantes y responsabilidades

| Integrante | Responsabilidad | Contribución verificable |
|---|---|---|
| Tomas Gonzalez Zapata | Proyecto y aplicación web | Base del repositorio, panel web y adaptación del inventario. |
| Daniel Felipe Marin Marin | Publicación en IIS | Configuración de IIS, Application Pool, binding y documentación local. |
| Carla Juliana Giraldo Camacho | Azure App Service | Automatización, configuración y evidencias de la publicación en Azure. |
| Samuel Cristobal Cuello Duque | Pruebas y validación | Pruebas automatizadas y comprobación de los entornos. |
| Carolina Arango Escobar | Documentación y entrega | README final, evidencias, informe y video. |

Docente colaborador de GitHub: `oalarconpe`.

## Tecnología

- Node.js 22 o superior.
- Express 5.
- HTML, CSS y JavaScript sin framework para el panel.
- OpenAPI 3.0 y Swagger UI.
- Vitest y Supertest.
- IIS con URL Rewrite y Application Request Routing.
- Azure App Service para Linux.

## Desarrollo local

```powershell
npm ci
npm test
npm start
```

- Aplicación: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Panel web del inventario. |
| GET | `/health` | Estado del servicio. |
| GET | `/docs` | Documentación Swagger. |
| GET | `/api/products` | Lista productos. |
| GET | `/api/products/:id` | Consulta un producto. |
| POST | `/api/products` | Crea un producto. |
| PUT | `/api/products/:id` | Reemplaza un producto. |
| DELETE | `/api/products/:id` | Elimina un producto. |

## Azure App Service

La cuenta responsable debe iniciar sesión de forma interactiva con `az login`. No se deben compartir credenciales.

```powershell
.\scripts\deploy-azure.ps1 -AppName "inventario-tienda-itm-<sufijo>"
```

El script crea o actualiza el Resource Group, el App Service Plan, el Web App, las Application Settings, HTTPS Only y el despliegue ZIP.

URL pública de Azure: [https://inventario-tienda-itm-tomas-2026.azurewebsites.net](https://inventario-tienda-itm-tomas-2026.azurewebsites.net)  
Health check público: [https://inventario-tienda-itm-tomas-2026.azurewebsites.net/health](https://inventario-tienda-itm-tomas-2026.azurewebsites.net/health)  
Fecha de publicación en Azure: `27 de octubre de 2026`  
Fecha de publicación en IIS: `PENDIENTE`

Recursos utilizados:

- Resource Group: `rg-inventario-tienda-p3`.
- App Service Plan: `asp-inventario-tienda-p3`.
- Región del App Service: `Brazil South`.
- SKU: `F1 - Free`.
- Runtime: `Node.js 24 LTS`.
- HTTPS Only: habilitado.

## IIS

La configuración de IIS será completada por el integrante responsable en su rama de trabajo. El puerto previsto para el sitio público es `8081` y el backend Node.js utilizará el puerto interno `3001`.

## Evidencias y video

- Evidencias IIS: `evidencias/iis/`
- Evidencias Azure: `evidencias/azure/`
- Video: `PENDIENTE_URL_YOUTUBE`

## Notas

- Los datos se almacenan en memoria y se reinician al reiniciar la aplicación.
- No se deben incluir claves, tokens, contraseñas o cadenas de conexión en el repositorio ni en las capturas.
- Todos los integrantes deben realizar una contribución real mediante commit o Pull Request y participar en el video.
- La publicación técnica de Azure está operativa. Carla debe agregar las capturas solicitadas y documentar su validación desde su propia cuenta GitHub para conservar la trazabilidad individual.
