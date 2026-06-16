import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  getProfile,
  getStoredToken,
  loginUser,
  registerUser,
  removeStoredToken,
  setStoredToken
} from "../services/authService";

export const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    removeStoredToken();
    setUser(null);
    setToken(null);
    setError("");
  }, []);

  const restoreSession = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const profile = await getProfile();
      setToken(storedToken);
      setUser(profile);
    } catch (sessionError) {
      removeStoredToken();
      setToken(null);
      setUser(null);
      setError(sessionError?.response?.data?.message || "Session expired. Please login again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const authData = await loginUser(payload);
      if (!authData?.token) {
        throw new Error("Authentication token missing from response.");
      }

      setStoredToken(authData.token);
      setToken(authData.token);
      setUser({
        _id: authData._id,
        name: authData.name,
        email: authData.email,
        role: authData.role
      });
      return authData;
    } catch (loginError) {
      const message = loginError?.response?.data?.message || loginError?.message || "Login failed.";
      setError(message);
      throw loginError;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const authData = await registerUser(payload);
      if (!authData?.token) {
        throw new Error("Authentication token missing from response.");
      }

      setStoredToken(authData.token);
      setToken(authData.token);
      setUser({
        _id: authData._id,
        name: authData.name,
        email: authData.email,
        role: authData.role
      });
      return authData;
    } catch (registerError) {
      const message = registerError?.response?.data?.message || registerError?.message || "Registration failed.";
      setError(message);
      throw registerError;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError("");

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      loading,
      error,
      login,
      register,
      logout,
      clearError
    }),
    [user, token, loading, error, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
