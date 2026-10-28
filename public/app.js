const table = document.querySelector("#product-table");
const message = document.querySelector("#message");
const status = document.querySelector("#service-status");
const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function checkHealth() {
  try {
    const response = await fetch("/health", { cache: "no-store" });
    if (!response.ok) throw new Error("Servicio no disponible");
    const data = await response.json();
    status.className = "status ready";
    status.innerHTML = '<span class="status-dot" aria-hidden="true"></span>' +
      `Servicio operativo · ${escapeHtml(data.environment)}`;
  } catch {
    status.className = "status error";
    status.innerHTML = '<span class="status-dot" aria-hidden="true"></span>Servicio no disponible';
  }
}

async function loadProducts() {
  message.textContent = "Consultando inventario…";
  try {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const products = await response.json();

    table.innerHTML = products.length
      ? products.map((product) => `
          <tr>
            <td>${escapeHtml(product.sku)}</td>
            <td>
              <div class="product-name">${escapeHtml(product.name)}</div>
              <div class="product-description">${escapeHtml(product.description)}</div>
            </td>
            <td>${currency.format(product.price)}</td>
            <td>${product.stock}</td>
          </tr>`).join("")
      : '<tr><td colspan="4">No hay productos registrados.</td></tr>';

    document.querySelector("#product-count").textContent = products.length;
    document.querySelector("#stock-count").textContent = products.reduce(
      (total, product) => total + product.stock,
      0
    );
    document.querySelector("#inventory-value").textContent = currency.format(
      products.reduce((total, product) => total + product.price * product.stock, 0)
    );
    message.textContent = `Información actualizada: ${new Date().toLocaleTimeString("es-CO")}`;
  } catch (error) {
    table.innerHTML = '<tr><td colspan="4">No fue posible consultar el inventario.</td></tr>';
    message.textContent = `Error: ${error.message}`;
  }
}

document.querySelector("#refresh-button").addEventListener("click", loadProducts);
await Promise.all([checkHealth(), loadProducts()]);

