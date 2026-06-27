import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing from the URL.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(response.data?.message || "Password reset successfully. Redirecting to login...");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to reset password. Token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 mt-10">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-sm text-gray-500 mt-1">Enter and confirm your new account password.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pass" className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            id="pass"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label htmlFor="confirmPass" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            id="confirmPass"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {message && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
