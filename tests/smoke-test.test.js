import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { ProductStore } from "../src/product-store.js";
import { runSmokeTest } from "../scripts/smoke-test.mjs";

describe("Smoke test multientorno", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = createApp({ store: new ProductStore([]), appName: "Inventario Tienda" });
    server = await new Promise((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(() => new Promise((resolve) => server.close(resolve)));

  it("aprueba todas las comprobaciones contra un servidor sano", async () => {
    const report = await runSmokeTest(baseUrl);
    expect(report.results.filter((result) => !result.ok)).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.results.map((result) => `${result.method} ${result.expected}`)).toEqual([
      "GET 200",
      "GET 200",
      "GET 200",
      "GET 200",
      "POST 201",
      "DELETE 204"
    ]);
  });

  it("reporta falla cuando el servidor no responde", async () => {
    const report = await runSmokeTest("http://127.0.0.1:9");
    expect(report.ok).toBe(false);
    expect(report.results.every((result) => !result.ok)).toBe(true);
  });
});
