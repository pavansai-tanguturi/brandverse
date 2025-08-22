const request = require("supertest");
const app = require("../server");

describe("Product API", () => {
  let adminToken, productId;

  beforeAll(async () => {
    // login as admin
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "admin123" });

    adminToken = res.body.token;
  });

  it("should add a new product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Laptop",
        description: "High performance",
        price: 999.99,
        stock: 10,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.product.name).toBe("Laptop");
    productId = res.body.product.id;
  });

  it("should get all products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should show out-of-stock products", async () => {
    // update product stock to 0
    await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ stock: 0 });

    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.stock).toBe(0);
    expect(res.body.isOutOfStock).toBe(true); // field from controller
  });
});