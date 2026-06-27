import api from './api';
import { getStoredToken } from './authService';

function getAuth() {
  const token = getStoredToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function fetchWishlist() {
  const res = await api.get('/wishlist', getAuth());
  return res.data?.data || [];
}

export async function addToWishlist(productId) {
  const res = await api.post(`/wishlist/${productId}`, {}, getAuth());
  return res.data?.data || [];
}

export async function removeFromWishlist(productId) {
  const res = await api.delete(`/wishlist/${productId}`, getAuth());
  return res.data?.data || [];
}

export default { fetchWishlist, addToWishlist, removeFromWishlist };
