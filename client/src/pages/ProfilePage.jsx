import { useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

function ProfilePage() {
  const { user, updateUserProfile, loading: authLoading, error, clearError } = useAuth();
  const [form, setForm] = useState({
    name: "",
    password: "",
    confirmPassword: ""
  });
  const [touched, setTouched] = useState({
    name: false,
    password: false,
    confirmPassword: false
  });
  const [formInitialized, setFormInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  const handleResendVerification = async () => {
    setResending(true);
    setResendStatus("");
    try {
      const response = await api.post("/auth/resend-verification");
      setResendStatus("Verification email sent successfully!");
    } catch (err) {
      setResendStatus(err?.response?.data?.message || err.message || "Failed to resend link. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const nameInvalid = touched.name && form.name.trim().length < 2;
  const passwordInvalid = touched.password && form.password.length > 0 && form.password.length < 6;
  const confirmInvalid = touched.confirmPassword && form.password !== form.confirmPassword;

  const createdDate = useMemo(() => {
    if (!user?.createdAt) return "Unavailable";
    return new Date(user.createdAt).toLocaleDateString();
  }, [user]);

  useEffect(() => {
    if (authLoading || formInitialized) return;

    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || ""
      }));
    }

    setFormInitialized(true);
  }, [authLoading, formInitialized, user?.name]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({
      name: true,
      password: true,
      confirmPassword: true
    });
    setSuccessMessage("");
    setSubmitError("");
    clearError();

    if (!form.name.trim() || nameInvalid || passwordInvalid || confirmInvalid) {
      setSubmitError("Please fix validation errors before saving.");
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile({
        name: form.name.trim(),
        ...(form.password ? { password: form.password } : {})
      });
      setSuccessMessage("Profile updated successfully.");
      setForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));
      setTouched({
        name: false,
        password: false,
        confirmPassword: false
      });
    } catch {
      // Context manages API error.
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !formInitialized) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <div className="mt-5 space-y-3 text-sm">
          <div>
            <p className="text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{user?.name || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium text-gray-900 flex items-center gap-2">
              {user?.email || "-"}
              {user?.isVerified ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                  Unverified
                </span>
              )}
            </p>
            {!user?.isVerified && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 outline-none disabled:opacity-50"
                >
                  {resending ? "Resending..." : "Resend verification link"}
                </button>
                {resendStatus && (
                  <p className="text-xs font-medium text-indigo-600 mt-1">{resendStatus}</p>
                )}
              </div>
            )}
          </div>
          <div>
            <p className="text-gray-500">Account Created</p>
            <p className="font-medium text-gray-900">{createdDate}</p>
          </div>
          <div className="mt-4">
            <a href="/addresses" className="inline-block rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Manage Addresses</a>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
                nameInvalid ? "border-red-300 bg-red-50" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
            />
            {nameInvalid && <p className="mt-1 text-xs text-red-600">Name must contain at least 2 characters.</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                placeholder="Leave empty to keep current"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
                  passwordInvalid
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                }`}
              />
              {passwordInvalid && <p className="mt-1 text-xs text-red-600">Password must be at least 6 characters.</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                placeholder="Re-enter new password"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition ${
                  confirmInvalid
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                }`}
              />
              {confirmInvalid && <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>}
            </div>
          </div>

          {(submitError || error) && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError || error}</p>
          )}
          {successMessage && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;
