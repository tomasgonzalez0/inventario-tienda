# Smoke test - Inventario Tienda

- URL base: https://inventario-tienda-itm-tomas-2026.azurewebsites.net
- Fecha: 2026-10-28T01:15:02.240Z
- Resultado global: OK

| Método | Ruta | Esperado | Obtenido | Tiempo (ms) | Resultado | Detalle |
|---|---|---|---|---|---|---|
| GET | / | 200 | 200 | 1030 | OK |  |
| GET | /health | 200 | 200 | 543 | OK |  |
| GET | /docs | 200 | 200 | 364 | OK |  |
| GET | /api/products | 200 | 200 | 187 | OK |  |
| POST | /api/products | 201 | 201 | 183 | OK |  |
| DELETE | /api/products/bf8f18df-91fd-4eef-8f11-b7c5ef18ab6e | 204 | 204 | 182 | OK |  |
