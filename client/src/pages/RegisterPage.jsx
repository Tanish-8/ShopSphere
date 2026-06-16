import { useState } from "react";
import { Link } from "react-router-dom";

function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const nameInvalid = touched.name && form.name.trim().length < 2;
  const emailInvalid = touched.email && !/\S+@\S+\.\S+/.test(form.email);
  const passwordInvalid = touched.password && form.password.length < 6;
  const confirmInvalid = touched.confirmPassword && form.confirmPassword !== form.password;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
      <p className="mt-2 text-sm text-gray-600">Register to start your shopping journey.</p>

      <form className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            placeholder="John Doe"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
              nameInvalid ? "border-red-300 bg-red-50" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            }`}
          />
          {nameInvalid && <p className="mt-1 text-xs text-red-600">Name must contain at least 2 characters.</p>}
        </div>

        <div>
          <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            placeholder="you@example.com"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
              emailInvalid ? "border-red-300 bg-red-50" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            }`}
          />
          {emailInvalid && <p className="mt-1 text-xs text-red-600">Please enter a valid email address.</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              placeholder="Minimum 6 characters"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
                passwordInvalid
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
            />
            {passwordInvalid && <p className="mt-1 text-xs text-red-600">Minimum 6 characters required.</p>}
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
              placeholder="Re-enter password"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
                confirmInvalid
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
            />
            {confirmInvalid && <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Register
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Login
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
