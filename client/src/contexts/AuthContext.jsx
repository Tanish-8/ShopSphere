import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  getProfile,
  getStoredToken,
  loginUser,
  registerUser,
  removeStoredToken,
  setStoredToken,
  updateProfile
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

  const login = useCallback(async (payload) => {
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
  }, []);

  const register = useCallback(async (payload) => {
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
  }, []);

  const clearError = useCallback(() => setError(""), []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
      return profile;
    } catch (profileError) {
      const message = profileError?.response?.data?.message || profileError?.message || "Failed to refresh profile.";
      setError(message);
      throw profileError;
    }
  }, []);

  const updateUserProfile = useCallback(async (payload) => {
    setLoading(true);
    setError("");
    try {
      const updated = await updateProfile(payload);
      setUser((prev) => ({
        ...prev,
        ...updated
      }));
      return updated;
    } catch (updateError) {
      const message = updateError?.response?.data?.message || updateError?.message || "Profile update failed.";
      setError(message);
      throw updateError;
    } finally {
      setLoading(false);
    }
  }, []);

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
      clearError,
      refreshUser,
      updateUserProfile
    }),
    [user, token, loading, error, logout, login, register, clearError, refreshUser, updateUserProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
