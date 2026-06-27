import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError } = useAuth();

  const emailInvalid = touched.email && !/\S+@\S+\.\S+/.test(email);
  const passwordInvalid = touched.password && password.length < 6;
  const redirectPath = location.state?.from?.pathname || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setSubmitError("");
    clearError();

    if (!email || !password || emailInvalid || passwordInvalid) {
      setSubmitError("Please fix validation errors before continuing.");
      return;
    }

    try {
      await login({ email, password });
      navigate(redirectPath, { replace: true });
    } catch {
      // Context already sets global auth error.
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
      <p className="mt-2 text-sm text-gray-600">Login to continue shopping on ShopSphere.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            placeholder="you@example.com"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
              emailInvalid ? "border-red-300 bg-red-50" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            }`}
          />
          {emailInvalid && <p className="mt-1 text-xs text-red-600">Please enter a valid email address.</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            placeholder="Minimum 6 characters"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
              passwordInvalid
                ? "border-red-300 bg-red-50"
                : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            }`}
          />
          {passwordInvalid && <p className="mt-1 text-xs text-red-600">Password must be at least 6 characters.</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {(submitError || error) && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError || error}
        </p>
      )}

      <p className="mt-5 text-center text-sm text-gray-600">
        New to ShopSphere?{" "}
        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
