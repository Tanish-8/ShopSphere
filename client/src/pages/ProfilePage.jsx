import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

export default function ProfilePage() {
  const { user, updateUserProfile, loading: authLoading, error, clearError } = useAuth();
  
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || (user?.email ? user.email.split("@")[0] : ""));
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [gender, setGender] = useState(user?.gender || "prefer_not");
  const [avatar, setAvatar] = useState(user?.avatar || "");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || (user.email ? user.email.split("@")[0] : ""));
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setDob(user.dob || "");
      setGender(user.gender || "prefer_not");
      setAvatar(user.avatar || "");
    }
  }, [user]);

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

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSubmitError("Image size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = () => {
    setAvatar("");
  };

  const handleReset = () => {
    setName(user?.name || "");
    setUsername(user?.username || (user?.email ? user.email.split("@")[0] : ""));
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setDob(user?.dob || "");
    setGender(user?.gender || "prefer_not");
    setAvatar(user?.avatar || "");
    setSuccessMessage("");
    setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setSubmitError("");
    clearError();

    if (!name.trim()) {
      setSubmitError("Full name is required.");
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dob,
        gender,
        avatar
      });
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const completionInfo = useMemo(() => {
    let score = 0;
    if (name?.trim()) score += 20;
    if (email?.trim()) score += 20;
    if (phone?.trim()) score += 20;
    if (username?.trim()) score += 15;
    if (dob) score += 12.5;
    if (gender && gender !== "prefer_not") score += 12.5;
    
    const percentage = Math.min(100, Math.round(score));
    let nextStep = "Your profile is 100% complete!";
    if (!phone?.trim()) nextStep = "Add a mobile number to reach 100% completion.";
    else if (!username?.trim()) nextStep = "Add a username to reach 100% completion.";
    else if (!dob) nextStep = "Add your date of birth to reach 100% completion.";
    else if (!gender || gender === "prefer_not") nextStep = "Select gender preference to reach 100% completion.";

    return { percentage, nextStep };
  }, [name, email, phone, username, dob, gender]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return "Member Since July 2026";
    const date = new Date(user.createdAt);
    return `Member Since ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  }, [user]);

  if (authLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-sm text-gray-600 dark:text-gray-300 shadow-sm">
        Loading Account Center...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Title block */}
      <div className="space-y-1 pb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Account Center</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manage your identity, personal profile details, and account overview.</p>
      </div>

      {/* 1. Professional Profile Header Card */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar Frame */}
          <div className="relative shrink-0 group">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="h-20 w-20 rounded-full object-cover border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50 dark:ring-gray-700"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-md ring-4 ring-indigo-50 dark:ring-gray-700 select-none">
                {name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-800" title="Active Account"></span>
          </div>

          {/* Info & Photo Actions */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight flex items-center justify-center sm:justify-start gap-2">
                  {name || "Valued Customer"}
                  <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20">
                    🟢 Active
                  </span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{email || "no-email@example.com"}</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <label className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer">
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                {avatar && (
                  <button
                    type="button"
                    onClick={handlePhotoRemove}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/40 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/60">
              <span className="flex items-center gap-1">
                <span>🗓️</span> {memberSince}
              </span>
              <span>•</span>
              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>✔</span> Verified Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                  <span>⚠️</span> Unverified Account
                </span>
              )}
              {!user?.isVerified && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 cursor-pointer ml-1"
                >
                  {resending ? "Sending..." : "Resend Link"}
                </button>
              )}
            </div>
            {resendStatus && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{resendStatus}</p>}
          </div>
        </div>
      </section>

      {/* 2. Profile Completion Widget */}
      <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 space-y-2 text-left">
        <div className="flex items-center justify-between text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
          <span className="flex items-center gap-1.5">
            <span>⚡</span> Profile Completion
          </span>
          <span className="text-indigo-600 dark:text-indigo-400 font-black">{completionInfo.percentage}%</span>
        </div>
        <div className="h-2.5 w-full bg-indigo-100 dark:bg-indigo-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${completionInfo.percentage}%` }}
          />
        </div>
        <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300 font-medium">
          {completionInfo.nextStep}
        </p>
      </section>

      {/* 3. Account Summary Dashboard Widgets */}
      <section className="space-y-3 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Account Overview
          </h3>
          <span className="text-[10px] font-semibold text-gray-400">Live Statistics</span>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 text-left">
          {/* Orders Widget */}
          <Link
            to="/orders"
            className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-200 flex flex-col justify-between h-full space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-lg group-hover:scale-110 transition-transform">📦</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                Orders
              </span>
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900 dark:text-white tracking-tight">12</span>
              <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Total Orders</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[10px] text-gray-400 font-bold">
              <span>10 Delivered</span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">2 In Transit</span>
            </div>
          </Link>

          {/* Wishlist Widget */}
          <Link
            to="/wishlist"
            className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:border-rose-400 dark:hover:border-rose-600 transition-all duration-200 flex flex-col justify-between h-full space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-lg group-hover:scale-110 transition-transform">❤️</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                Wishlist
              </span>
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900 dark:text-white tracking-tight">5</span>
              <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Saved Products</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[10px] text-gray-400 font-bold">
              <span>In Stock</span>
              <span className="text-rose-600 dark:text-rose-400 font-extrabold">View List →</span>
            </div>
          </Link>

          {/* Coupons Widget */}
          <Link
            to="/coupons"
            className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 flex flex-col justify-between h-full space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-lg group-hover:scale-110 transition-transform">🎟️</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Coupons
              </span>
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900 dark:text-white tracking-tight">4</span>
              <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Active Promo Codes</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[10px] text-gray-400 font-bold">
              <span>Max Discount</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹2,000 OFF</span>
            </div>
          </Link>

          {/* Addresses Widget */}
          <Link
            to="/addresses"
            className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-200 flex flex-col justify-between h-full space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-lg group-hover:scale-110 transition-transform">📍</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                Addresses
              </span>
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900 dark:text-white tracking-tight">2</span>
              <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">Saved Locations</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[10px] text-gray-400 font-bold">
              <span>Primary: Home</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Default Set</span>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Editable Personal Details Form */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-5 text-left">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Personal Details</h2>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Editable Fields</span>
        </div>
        
        {successMessage && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{successMessage}</p>}
        {(submitError || error) && <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{submitError || error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. tanish_m"
                className="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Mobile Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition cursor-pointer"
              >
                <option value="prefer_not">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-start gap-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition cursor-pointer"
            >
              Reset Changes
            </button>
          </div>
        </form>
      </section>

      {/* 5. Default Shipping Address Summary */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📍</span> Default Shipping Location
          </h2>
          <Link
            to="/addresses"
            className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Manage Addresses →
          </Link>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-gray-900 dark:text-white">{name || "Primary Customer"}</span>
              <span className="inline-block rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                Default
              </span>
            </div>
            <p>100 Innovation Way, Suite 400</p>
            <p>Tech City, TC 94016 • United States</p>
            <p className="text-[10px] text-gray-400 font-semibold">Phone: {phone || "+1 (800) 555-0199"}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/addresses"
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Edit Address
            </Link>
            <Link
              to="/addresses"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
            >
              + Add New
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Account Information (Read-Only) */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4 text-left">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700/60 pb-2">
          Account Diagnostics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase text-gray-400">Customer ID</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{user?._id || "CUST-940215"}</span>
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase text-gray-400">Account Created</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {new Date(user?.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold uppercase text-gray-400">Email Verification</span>
            {user?.isVerified ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <span>✔</span> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <span>⚠️</span> Unverified
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
