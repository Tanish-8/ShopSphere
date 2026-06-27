import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

function ProfilePage() {
  const { user, updateUserProfile, loading: authLoading, error, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false });
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
      await api.post("/auth/resend-verification");
      setResendStatus("Verification email sent successfully!");
    } catch (err) {
      setResendStatus(err?.response?.data?.message || err.message || "Failed to resend link. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const nameInvalid = touched.name && name.trim().length < 2;
  const emailInvalid = touched.email && (!email.trim() || !/\S+@\S+\.\S+/.test(email));

  const createdDate = useMemo(() => {
    if (!user?.createdAt) return "Unavailable";
    return new Date(user.createdAt).toLocaleDateString();
  }, [user]);

  useEffect(() => {
    if (authLoading || formInitialized) return;

    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }

    setFormInitialized(true);
  }, [authLoading, formInitialized, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({
      name: true,
      email: true
    });
    setSuccessMessage("");
    setSubmitError("");
    clearError();

    if (!name.trim() || nameInvalid || emailInvalid) {
      setSubmitError("Please fix validation errors before saving.");
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      });
      setSuccessMessage("Profile updated successfully.");
      setTouched({
        name: false,
        email: false
      });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to update profile.");
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
    <div className="grid gap-6 lg:grid-cols-3 text-left">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-gray-500 font-semibold text-xs">Name</p>
            <p className="font-bold text-gray-900 mt-0.5">{user?.name || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold text-xs">Email</p>
            <p className="font-bold text-gray-900 mt-0.5 flex flex-wrap items-center gap-2">
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
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 outline-none disabled:opacity-50 cursor-pointer"
                >
                  {resending ? "Resending..." : "Resend verification link"}
                </button>
                {resendStatus && (
                  <p className="text-xs font-medium text-indigo-600 mt-1">{resendStatus}</p>
                )}
              </div>
            )}
          </div>
          {user?.phone && (
            <div>
              <p className="text-gray-500 font-semibold text-xs">Phone</p>
              <p className="font-bold text-gray-900 mt-0.5">{user.phone}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500 font-semibold text-xs">Account Created</p>
            <p className="font-bold text-gray-900 mt-0.5">{createdDate}</p>
          </div>
          <div className="pt-2">
            <Link to="/addresses" className="btn-primary">
              Manage Addresses
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-50 pb-2">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-bold uppercase text-gray-500">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition ${
                nameInvalid ? "border-red-300 bg-red-50" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              }`}
              required
            />
            {nameInvalid && <p className="mt-1 text-xs text-red-600">Name must contain at least 2 characters.</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase text-gray-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition ${
                  emailInvalid ? "border-red-300 bg-red-50" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                }`}
                required
              />
              {emailInvalid && <p className="mt-1 text-xs text-red-600">Please enter a valid email address.</p>}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-xs font-bold uppercase text-gray-500">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          </div>

          {(submitError || error) && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
              {submitError || error}
            </p>
          )}
          {successMessage && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-600">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;
