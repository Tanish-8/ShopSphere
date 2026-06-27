/**
 * Targeted security/config tests for H8-H11.
 * Run: node tools/test_h8_h11.js
 */
const BASE = process.env.API_BASE || "http://localhost:5001/api";

async function request(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(email, password) {
  const res = await request("POST", "/auth/login", { body: { email, password } });
  assert(res.status === 200, `Login failed for ${email}: ${res.data.message}`);
  return res.data.data.token;
}

async function registerUser(suffix) {
  const email = `h8test-${suffix}-${Date.now()}@shopsphere.dev`;
  const res = await request("POST", "/auth/register", {
    body: { name: `Test ${suffix}`, email, password: "password123" },
  });
  assert(res.status === 201, `Register failed: ${res.data.message}`);
  return { email, token: res.data.data.token };
}

async function createCodOrder(token) {
  const products = await request("GET", "/products");
  const product = products.data.data[0];
  assert(product, "No products available for test order");

  const res = await request("POST", "/orders", {
    token,
    body: {
      orderItems: [{ product: product._id, quantity: 1 }],
      shippingAddress: {
        street: "1 Test St",
        city: "Testville",
        state: "TS",
        zipCode: "12345",
        country: "US",
      },
      paymentMethod: "cod",
    },
  });
  assert(res.status === 201, `Create order failed: ${res.data.message}`);
  return res.data.data;
}

async function markPaid(token, orderId) {
  return request("PUT", `/orders/${orderId}/pay`, { token });
}

async function main() {
  console.log("H8-H11 targeted tests\n");

  const adminToken = await login("seeder-admin@shopsphere.dev", "password123");
  const userA = await registerUser("owner");
  const userB = await registerUser("other");

  const order = await createCodOrder(userA.token);
  console.log(`Created order ${order._id} as user A`);

  const nonOwner = await markPaid(userB.token, order._id);
  assert(nonOwner.status === 403, `Expected 403 for non-owner, got ${nonOwner.status}`);
  console.log("PASS: non-owner cannot mark order paid");

  const owner = await markPaid(userA.token, order._id);
  assert(owner.status === 200 && owner.data.success, `Expected owner success, got ${owner.status}`);
  assert(owner.data.data.isPaid === true, "Order should be marked paid");
  console.log("PASS: owner can mark own order paid");

  const order2 = await createCodOrder(userA.token);
  const adminPay = await markPaid(adminToken, order2._id);
  assert(adminPay.status === 200 && adminPay.data.success, `Expected admin success, got ${adminPay.status}`);
  console.log("PASS: admin can mark any order paid");

  const payment = await request("POST", "/payments/create-order", {
    token: adminToken,
    body: { amount: 100, orderId: order2._id },
  });
  const hasConfigError =
    payment.status === 503 &&
    payment.data.message?.includes("Razorpay") &&
    payment.data.message?.includes("not configured");
  assert(hasConfigError, `Expected Razorpay config error 503, got ${payment.status}: ${payment.data.message}`);
  console.log("PASS: missing Razorpay credentials return configuration error");

  console.log("\nAll targeted tests passed.");
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
