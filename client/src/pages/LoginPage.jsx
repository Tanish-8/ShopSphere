import { useState } from "react";
import { Link } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailInvalid = touched.email && !/\S+@\S+\.\S+/.test(email);
  const passwordInvalid = touched.password && password.length < 6;

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
      <p className="mt-2 text-sm text-gray-600">Login to continue shopping on ShopSphere.</p>

      <form className="mt-6 space-y-4">
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
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
            Password
          </label>
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
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Login
        </button>
      </form>

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
