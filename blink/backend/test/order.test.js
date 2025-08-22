const request = require("supertest");
const app = require("../server");

describe("Order API", () => {
  let userToken, productId;

  beforeAll(async () => {
    // login user
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    userToken = loginRes.body.token;

    // add product with stock
    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Phone",
        description: "Smartphone",
        price: 500,
        stock: 2,
      });

    productId = productRes.body.product.id;
  });

  it("should not allow ordering out-of-stock product", async () => {
    // update stock to 0
    await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ stock: 0 });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Product is out of stock");
  });

  it("should create an order when stock is available", async () => {
    // restore stock
    await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ stock: 5 });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1 });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Order created successfully");
  });
});