import { randomUUID } from "node:crypto";

const initialProducts = [
  {
    id: "0f74f82d-cba4-46ab-a486-b745d642ca4e",
    sku: "LAP-001",
    name: "Portátil de desarrollo",
    description: "Equipo de 16 GB de RAM para desarrollo de software.",
    price: 3200000,
    stock: 8
  },
  {
    id: "148ef6d0-3767-4bc6-8bfd-162350282ced",
    sku: "MON-001",
    name: "Monitor de 24 pulgadas",
    description: "Monitor IPS Full HD.",
    price: 680000,
    stock: 15
  }
];

export class ProductStore {
  constructor(seed = initialProducts) {
    this.products = seed.map((product) => ({ ...product }));
  }

  list() {
    return this.products.map((product) => ({ ...product }));
  }

  findById(id) {
    return this.products.find((product) => product.id === id) ?? null;
  }

  hasSku(sku, exceptId = null) {
    return this.products.some(
      (product) => product.sku === sku && product.id !== exceptId
    );
  }

  create(input) {
    const product = { id: randomUUID(), ...input };
    this.products.push(product);
    return { ...product };
  }

  update(id, input) {
    const index = this.products.findIndex((product) => product.id === id);
    if (index === -1) return null;

    this.products[index] = { id, ...input };
    return { ...this.products[index] };
  }

  remove(id) {
    const index = this.products.findIndex((product) => product.id === id);
    if (index === -1) return false;

    this.products.splice(index, 1);
    return true;
  }
}

