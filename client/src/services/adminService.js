import api from "./api";
import { getStoredToken } from "./authService";

function getAuthConfig() {
  const token = getStoredToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function getDashboardStats() {
  const response = await api.get("/admin/stats", getAuthConfig());
  return response.data?.data;
}

export async function fetchAllUsers() {
  const response = await api.get("/auth/users", getAuthConfig());
  return response.data?.data || [];
}

export async function updateUserRole(userId, role) {
  const response = await api.put(`/auth/users/${userId}/role`, { role }, getAuthConfig());
  return response.data?.data;
}

export async function deleteUser(userId) {
  const response = await api.delete(`/auth/users/${userId}`, getAuthConfig());
  return response.data;
}
