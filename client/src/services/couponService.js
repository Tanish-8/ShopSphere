import api from "./api";
import { getStoredToken } from "./authService";

function getAuthConfig() {
  const token = getStoredToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function validateCoupon(code, cartItems) {
  const response = await api.post("/coupons/validate", { code, cartItems }, getAuthConfig());
  return response.data;
}

export async function fetchAdminCoupons(params = {}) {
  const config = { params, ...getAuthConfig() };
  const response = await api.get("/coupons", config);
  return response.data;
}

export async function createCoupon(couponData) {
  const response = await api.post("/coupons", couponData, getAuthConfig());
  return response.data;
}

export async function updateCoupon(id, couponData) {
  const response = await api.put(`/coupons/${id}`, couponData, getAuthConfig());
  return response.data;
}

export async function deleteCoupon(id) {
  const response = await api.delete(`/coupons/${id}`, getAuthConfig());
  return response.data;
}
