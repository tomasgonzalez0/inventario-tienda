import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { ProductStore } from "../src/product-store.js";

const validProduct = {
  sku: "TEC-100",
  name: "Teclado mecánico",
  description: "Teclado para desarrollo",
  price: 280000,
  stock: 10
};

describe("Inventario Tienda", () => {
  let app;

  beforeEach(() => {
    app = createApp({ store: new ProductStore([]), appName: "Inventario Tienda" });
  });

  it("publica la página principal", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.type).toContain("html");
    expect(response.text).toContain("Inventario Tienda");
  });

  it("enlaza la documentación y el estado desde la página principal", async () => {
    const response = await request(app).get("/");
    expect(response.text).toContain('href="/docs"');
    expect(response.text).toContain('href="/health"');
  });

  it("sirve los recursos estáticos de la página principal", async () => {
    const styles = await request(app).get("/styles.css");
    expect(styles.status).toBe(200);
    expect(styles.type).toContain("css");

    const script = await request(app).get("/app.js");
    expect(script.status).toBe(200);
    expect(script.type).toContain("javascript");
  });

  it("responde al health check", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.type).toContain("json");
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("inventario-tienda");
  });

  it("informa el entorno de ejecución en el health check", async () => {
    const previous = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      expect((await request(app).get("/health")).body.environment).toBe("production");

      delete process.env.NODE_ENV;
      expect((await request(app).get("/health")).body.environment).toBe("development");
    } finally {
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    }
  });

  it("publica la documentación OpenAPI", async () => {
    const docs = await request(app).get("/docs/");
    expect(docs.status).toBe(200);
    expect(docs.type).toContain("html");

    const spec = await request(app).get("/openapi.yaml");
    expect(spec.status).toBe(200);
    expect(spec.text).toContain("openapi:");
  });

  it("no expone la tecnología del servidor", async () => {
    const response = await request(app).get("/health");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("expone información pública del servicio", async () => {
    const response = await request(app).get("/api/info");
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Inventario Tienda");
  });

  it("lista productos", async () => {
    const response = await request(app).get("/api/products");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("completa el ciclo CRUD", async () => {
    const created = await request(app).post("/api/products").send(validProduct);
    expect(created.status).toBe(201);
    expect(created.headers.location).toBe(`/api/products/${created.body.id}`);

    const found = await request(app).get(`/api/products/${created.body.id}`);
    expect(found.status).toBe(200);
    expect(found.body.sku).toBe("TEC-100");

    const updated = await request(app)
      .put(`/api/products/${created.body.id}`)
      .send({ ...validProduct, stock: 7 });
    expect(updated.status).toBe(200);
    expect(updated.body.stock).toBe(7);

    const deleted = await request(app).delete(`/api/products/${created.body.id}`);
    expect(deleted.status).toBe(204);

    expect((await request(app).get(`/api/products/${created.body.id}`)).status).toBe(404);
  });

  it("rechaza datos inválidos", async () => {
    const response = await request(app).post("/api/products").send({
      sku: "x",
      name: "",
      price: -1,
      stock: 1.5
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Datos de producto inválidos");
  });

  it("rechaza SKU duplicado", async () => {
    await request(app).post("/api/products").send(validProduct);
    const duplicate = await request(app).post("/api/products").send(validProduct);
    expect(duplicate.status).toBe(409);
  });

  it("devuelve 404 para recursos y rutas inexistentes", async () => {
    expect((await request(app).get("/api/products/no-existe")).status).toBe(404);
    expect((await request(app).get("/no-existe")).status).toBe(404);
  });
});

