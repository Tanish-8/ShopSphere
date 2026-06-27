import api from "./api";
import { getStoredToken } from "./authService";

function getAuthConfig() {
  const token = getStoredToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function createOrder(payload) {
  const response = await api.post("/orders", payload, getAuthConfig());
  return response.data?.data;
}

export async function calculateOrderPrices(payload) {
  const response = await api.post("/orders/calculate", payload, getAuthConfig());
  return response.data?.data;
}

export async function fetchMyOrders() {
  const response = await api.get("/orders/myorders", getAuthConfig());
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function fetchOrderById(id) {
  const response = await api.get(`/orders/${id}`, getAuthConfig());
  return response.data?.data;
}

export async function fetchAllOrders() {
  const response = await api.get(`/orders`, getAuthConfig());
  return response.data;
}

export async function updateOrderStatus(orderId, status, note) {
  const payload = { status };
  if (note) payload.note = note;
  const response = await api.put(`/orders/${orderId}/status`, payload, getAuthConfig());
  return response.data?.data;
}

export async function downloadInvoice(orderId) {
  const token = getStoredToken();
  const response = await api.get(`/orders/${orderId}/invoice`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    responseType: "blob",
  });
  return response.data;
}

export async function cancelOrder(orderId, reason) {
  const response = await api.put(`/orders/${orderId}/cancel`, { reason }, getAuthConfig());
  return response.data?.data;
}

export async function requestOrderReturn(orderId, payload) {
  const response = await api.put(`/orders/${orderId}/return`, payload, getAuthConfig());
  return response.data?.data;
}

export async function adminProcessRefund(orderId, payload) {
  const response = await api.post(`/orders/${orderId}/refund`, payload, getAuthConfig());
  return response.data?.data;
}
