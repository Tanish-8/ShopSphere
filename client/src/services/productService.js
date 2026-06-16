import api from "./api";

function extractData(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.products && Array.isArray(payload.products)) return payload.products;
  return payload;
}

export async function fetchProducts() {
  const response = await api.get("/products");
  return extractData(response.data);
}

export async function fetchProductById(id) {
  const response = await api.get(`/products/${id}`);
  return extractData(response.data);
}
