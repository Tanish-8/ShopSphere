import api from './api';
import { getStoredToken } from './authService';

function getAuthConfig() {
  const token = getStoredToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function createRazorpayOrder(payload) {
  const response = await api.post('/payments/create-order', payload, getAuthConfig());
  return response.data?.data;
}

export async function verifyRazorpayPayment(payload) {
  const response = await api.post('/payments/verify', payload, getAuthConfig());
  return response.data;
}
