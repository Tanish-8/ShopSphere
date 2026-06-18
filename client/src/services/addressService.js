import api from './api';
import { getStoredToken } from './authService';

function getAuthConfig() {
  const token = getStoredToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function getAddresses() {
  const res = await api.get('/addresses', getAuthConfig());
  return res.data?.data || [];
}

export async function addAddress(payload) {
  const res = await api.post('/addresses', payload, getAuthConfig());
  return res.data?.data;
}

export async function updateAddress(id, payload) {
  const res = await api.put(`/addresses/${id}`, payload, getAuthConfig());
  return res.data?.data;
}

export async function deleteAddress(id) {
  const res = await api.delete(`/addresses/${id}`, getAuthConfig());
  return res.data;
}

export async function setDefaultAddress(id) {
  const res = await api.put(`/addresses/${id}/default`, {}, getAuthConfig());
  return res.data?.data;
}
