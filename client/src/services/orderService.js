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

export async function fetchMyOrders() {
  const response = await api.get("/orders/myorders", getAuthConfig());
  return Array.isArray(response.data?.data) ? response.data.data : [];
}
