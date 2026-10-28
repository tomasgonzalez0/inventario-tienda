import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_URL = "http://localhost:3000";
const TIMEOUT_MS = 10000;

async function call(baseUrl, method, path, body) {
  const started = performance.now();
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const text = await response.text();
  return { response, text, ms: Math.round(performance.now() - started) };
}

async function check(results, baseUrl, method, path, expectedStatus, verify, body) {
  const result = { method, path, expected: expectedStatus, status: null, ms: null, ok: false, detail: "" };
  results.push(result);
  try {
    const { response, text, ms } = await call(baseUrl, method, path, body);
    result.status = response.status;
    result.ms = ms;
    if (response.status !== expectedStatus) {
      result.detail = `Se esperaba HTTP ${expectedStatus}`;
      return null;
    }
    const problem = verify?.(response, text);
    if (problem) {
      result.detail = problem;
      return null;
    }
    result.ok = true;
    return { response, text };
  } catch (error) {
    result.detail = error.name === "TimeoutError" ? `Sin respuesta en ${TIMEOUT_MS} ms` : error.message;
    return null;
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function runSmokeTest(baseUrl) {
  const results = [];

  await check(results, baseUrl, "GET", "/", 200, (response, text) => {
    if (!response.headers.get("content-type")?.includes("html")) return "No devuelve HTML";
    if (!text.includes("Inventario Tienda")) return 'No contiene "Inventario Tienda"';
  });

  await check(results, baseUrl, "GET", "/health", 200, (_response, text) => {
    const health = parseJson(text);
    if (health?.status !== "ok") return 'status distinto de "ok"';
    if (health.service !== "inventario-tienda") return 'service distinto de "inventario-tienda"';
  });

  await check(results, baseUrl, "GET", "/docs", 200, (response) => {
    if (!response.headers.get("content-type")?.includes("html")) return "Swagger no devuelve HTML";
  });

  await check(results, baseUrl, "GET", "/api/products", 200, (_response, text) => {
    if (!Array.isArray(parseJson(text))) return "No devuelve un arreglo JSON";
  });

  const product = {
    sku: `SMK-${Date.now()}`,
    name: "Producto de smoke test",
    description: "Creado y eliminado automáticamente por el smoke test",
    price: 1000,
    stock: 1
  };
  const created = await check(results, baseUrl, "POST", "/api/products", 201, (response, text) => {
    if (!response.headers.get("location")) return "Falta la cabecera Location";
    if (!parseJson(text)?.id) return "La respuesta no incluye id";
  }, product);

  if (created) {
    const { id } = parseJson(created.text);
    await check(results, baseUrl, "DELETE", `/api/products/${id}`, 204);
  }

  return { baseUrl, date: new Date().toISOString(), ok: results.every((result) => result.ok), results };
}

function formatTable(report) {
  const rows = report.results.map((result) =>
    `| ${result.method} | ${result.path} | ${result.expected} | ${result.status ?? "—"} | ${result.ms ?? "—"} | ${result.ok ? "OK" : "FALLA"} | ${result.detail} |`
  );
  return [
    "| Método | Ruta | Esperado | Obtenido | Tiempo (ms) | Resultado | Detalle |",
    "|---|---|---|---|---|---|---|",
    ...rows
  ].join("\n");
}

function formatReport(report) {
  return [
    "# Smoke test - Inventario Tienda",
    "",
    `- URL base: ${report.baseUrl}`,
    `- Fecha: ${report.date}`,
    `- Resultado global: ${report.ok ? "OK" : "FALLA"}`,
    "",
    formatTable(report),
    ""
  ].join("\n");
}

function parseArgs(argv) {
  const options = { baseUrl: process.env.SMOKE_BASE_URL ?? DEFAULT_BASE_URL, reportPath: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--report") options.reportPath = argv[++index];
    else options.baseUrl = argv[index];
  }
  return options;
}

async function main() {
  const { baseUrl, reportPath } = parseArgs(process.argv.slice(2));
  console.log(`Ejecutando smoke test contra ${baseUrl}\n`);

  const report = await runSmokeTest(baseUrl);
  console.log(formatTable(report));
  console.log(`\nResultado global: ${report.ok ? "OK" : "FALLA"}`);

  if (reportPath) {
    const target = resolve(reportPath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, formatReport(report), "utf8");
    console.log(`Reporte guardado en ${target}`);
  }

  process.exitCode = report.ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
