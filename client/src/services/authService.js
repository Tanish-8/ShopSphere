import api from "./api";

const TOKEN_KEY = "shopsphere_token";

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthConfig() {
  const token = getStoredToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function registerUser(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data?.data;
}

export async function loginUser(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data?.data;
}

export async function getProfile() {
  const response = await api.get("/auth/profile", getAuthConfig());
  return response.data?.data;
}

export async function updateProfile(payload) {
  const response = await api.put("/auth/profile", payload, getAuthConfig());
  return response.data?.data;
}

export { TOKEN_KEY, getStoredToken, setStoredToken, removeStoredToken };
