# Smoke test - Inventario Tienda

- URL base: http://localhost:3000
- Fecha: 2026-10-28T00:48:07.780Z
- Resultado global: OK

| Método | Ruta | Esperado | Obtenido | Tiempo (ms) | Resultado | Detalle |
|---|---|---|---|---|---|---|
| GET | / | 200 | 200 | 62 | OK |  |
| GET | /health | 200 | 200 | 4 | OK |  |
| GET | /docs | 200 | 200 | 6 | OK |  |
| GET | /api/products | 200 | 200 | 4 | OK |  |
| POST | /api/products | 201 | 201 | 20 | OK |  |
| DELETE | /api/products/545d38dc-44fe-4abe-ad9e-a5a8d42e3aa4 | 204 | 204 | 2 | OK |  |
