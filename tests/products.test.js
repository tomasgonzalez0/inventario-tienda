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

  it("responde al health check", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("inventario-tienda");
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

