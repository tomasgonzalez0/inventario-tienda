import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ProductStore } from "./product-store.js";

const publicPath = fileURLToPath(new URL("../public", import.meta.url));
const openApiPath = fileURLToPath(new URL("../openapi.yaml", import.meta.url));
const openApiText = readFileSync(openApiPath, "utf8");
const openApiDocument = YAML.parse(openApiText);

const productInputSchema = z
  .object({
    sku: z.string().trim().min(3).max(30).transform((value) => value.toUpperCase()),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).default(""),
    price: z.number().finite().nonnegative(),
    stock: z.number().int().nonnegative()
  })
  .strict();

function validationError(result) {
  return {
    error: "Datos de producto inválidos",
    details: result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }))
  };
}

export function createApp({ store = new ProductStore(), appName } = {}) {
  const serviceName = appName ?? process.env.APP_NAME ?? "Inventario Tienda";
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "100kb" }));
  app.use(express.static(publicPath));

  app.get("/health", (_request, response) => {
    response.status(200).json({
      status: "ok",
      service: "inventario-tienda",
      environment: process.env.NODE_ENV ?? "development"
    });
  });

  app.get("/api/info", (_request, response) => {
    response.json({
      name: serviceName,
      version: "1.0.0",
      documentation: "/docs",
      health: "/health"
    });
  });

  app.get("/openapi.yaml", (_request, response) => {
    response.type("application/yaml").send(openApiText);
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.get("/api/products", (_request, response) => {
    response.json(store.list());
  });

  app.get("/api/products/:id", (request, response) => {
    const product = store.findById(request.params.id);
    if (!product) {
      return response.status(404).json({ error: "Producto no encontrado" });
    }
    return response.json(product);
  });

  app.post("/api/products", (request, response) => {
    const result = productInputSchema.safeParse(request.body);
    if (!result.success) {
      return response.status(400).json(validationError(result));
    }
    if (store.hasSku(result.data.sku)) {
      return response.status(409).json({ error: "El SKU ya existe" });
    }

    const created = store.create(result.data);
    return response
      .status(201)
      .location(`/api/products/${created.id}`)
      .json(created);
  });

  app.put("/api/products/:id", (request, response) => {
    if (!store.findById(request.params.id)) {
      return response.status(404).json({ error: "Producto no encontrado" });
    }

    const result = productInputSchema.safeParse(request.body);
    if (!result.success) {
      return response.status(400).json(validationError(result));
    }
    if (store.hasSku(result.data.sku, request.params.id)) {
      return response.status(409).json({ error: "El SKU ya existe" });
    }

    return response.json(store.update(request.params.id, result.data));
  });

  app.delete("/api/products/:id", (request, response) => {
    if (!store.remove(request.params.id)) {
      return response.status(404).json({ error: "Producto no encontrado" });
    }
    return response.status(204).send();
  });

  app.use((_request, response) => {
    response.status(404).json({ error: "Ruta no encontrada" });
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && "body" in error) {
      return response.status(400).json({ error: "JSON inválido" });
    }
    console.error(error);
    return response.status(500).json({ error: "Error interno" });
  });

  return app;
}

