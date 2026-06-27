import api from "./api";

function normalizeProduct(rawProduct) {
  if (!rawProduct || typeof rawProduct !== "object") return null;

  const id = rawProduct._id || rawProduct.id || null;
  const images = Array.isArray(rawProduct.images)
    ? rawProduct.images.filter(Boolean)
    : rawProduct.image
      ? [rawProduct.image]
      : [];

  return {
    _id: id,
    id,
    name: rawProduct.name || rawProduct.title || "",
    description: rawProduct.description || "",
    price: Number(rawProduct.price || 0),
    images,
    image: rawProduct.image || images[0] || "",
    stock: Number(rawProduct.stock ?? rawProduct.countInStock ?? rawProduct.quantity ?? 0),
    rating: Number(rawProduct.rating ?? rawProduct.averageRating ?? 0),
    category: rawProduct.category?.name || rawProduct.category || "General",
    numReviews: Number(rawProduct.numReviews ?? 0)
  };
}

function extractProductList(payload) {
  const list = Array.isArray(payload) ? payload : payload?.data || payload?.products || [];
  return Array.isArray(list) ? list.map(normalizeProduct).filter(Boolean) : [];
}

function extractSingleProduct(payload) {
  const raw = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  return normalizeProduct(raw);
}

export async function fetchProducts(params = {}, signal) {
  const response = await api.get("/products", { params, signal });
  const products = extractProductList(response.data);
  products.totalProducts = response.data.totalProducts ?? response.data.total ?? products.length;
  products.totalPages = response.data.totalPages ?? response.data.pages ?? 1;
  products.currentPage = response.data.currentPage ?? response.data.page ?? 1;
  return products;
}

export async function fetchProductById(id) {
  const response = await api.get(`/products/${id}`);
  return extractSingleProduct(response.data);
}

// Fetch full product details (including reviews)
export async function fetchProductDetails(id) {
  const response = await api.get(`/products/${id}`);
  return response.data?.data || response.data;
}

export async function postProductReview(id, payload) {
  const token = getStoredToken();
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const response = await api.post(`/products/${id}/reviews`, payload, config);
  return response.data;
}

// Admin actions
import { getStoredToken } from "./authService";

function getAuthConfig() {
  const token = getStoredToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function fetchAllProductsAdmin(params = {}) {
  const config = { params, ...getAuthConfig() };
  const response = await api.get(`/products`, config);
  return extractProductList(response.data);
}

export async function createProductAdmin(payload) {
  const response = await api.post(`/products`, payload, getAuthConfig());
  return extractSingleProduct(response.data?.data || response.data);
}

export async function updateProductAdmin(id, payload) {
  const response = await api.put(`/products/${id}`, payload, getAuthConfig());
  return extractSingleProduct(response.data?.data || response.data);
}

export async function deleteProductAdmin(id) {
  const response = await api.delete(`/products/${id}`, getAuthConfig());
  return response.data;
}
