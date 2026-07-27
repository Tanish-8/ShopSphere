import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useTheme from "../hooks/useTheme";
import { updateProfile } from "../services/authService";
import CurrencySelector from "../components/common/CurrencySelector";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "security";

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Password Visibilities
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Preference Settings
  const [emailPromo, setEmailPromo] = useState(true);
  const [emailOrder, setEmailOrder] = useState(true);
  const [pushNotify, setPushNotify] = useState(false);
  const [smsNotify, setSmsNotify] = useState(true);

  // Privacy & Data
  const [downloadMsg, setDownloadMsg] = useState("");

  // Modal dialog toggles
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteErr, setDeleteErr] = useState("");

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordErr("");
    
    if (!currentPassword) {
      setPasswordErr("Current password is required.");
      return;
    }
    if (!password) {
      setPasswordErr("New password cannot be blank.");
      return;
    }
    if (password.length < 6) {
      setPasswordErr("New password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordErr("Passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await updateProfile({ password });
      setPasswordMsg("Password changed successfully.");
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordErr(err?.response?.data?.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const strengthInfo = useMemo(() => {
    if (!password) return { label: "", color: "bg-gray-200", score: 0 };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { label: "Weak", color: "bg-red-500", score };
    if (score <= 4) return { label: "Medium", color: "bg-amber-500", score };
    return { label: "Strong", color: "bg-emerald-500", score };
  }, [password]);

  const handleDownloadData = () => {
    setDownloadMsg("");
    const userData = {
      profile: {
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        createdAt: user?.createdAt,
        isVerified: user?.isVerified
      },
      exportedAt: new Date().toISOString(),
      system: "ShopSphere E-Commerce System"
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ShopSphere_Data_${user?.name?.replace(/\s+/g, "_") || "User"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadMsg("Your personal account data has been downloaded successfully.");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteErr("Type DELETE to confirm account deletion.");
      return;
    }
    setDeleteErr("");
    try {
      logout();
      navigate("/");
    } catch (err) {
      setDeleteErr(err?.response?.data?.message || "Failed to delete account.");
    }
  };

  const handleLogoutAllDevices = () => {
    logout();
    navigate("/login");
  };

  const tabs = [
    { id: "security", label: "Security & Password", icon: "🔑" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "privacy", label: "Privacy & Data", icon: "🛡️" },
    { id: "danger", label: "Danger Zone", icon: "🚨" },
  ];

  return (
    <div className="space-y-8 text-left pb-16">
      <style>{`
        @keyframes tabFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-tab-fade {
          animation: tabFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Header and Title block */}
      <div className="space-y-1.5 pb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Account Settings</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Configure security credentials, display preferences, privacy controls, and account management.</p>
      </div>

      {/* Mobile Navigation segmented horizontal row */}
      <div className="flex md:hidden gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto select-none mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              currentTab === tab.id
                ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {tab.icon} {tab.label.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-4 items-start">
        {/* Left Column: Sidebar layout */}
        <aside className="hidden md:block col-span-1 space-y-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-2xl shadow-sm">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`w-full h-11 flex items-center gap-3.5 px-3.5 text-xs font-bold rounded-xl transition text-left cursor-pointer border-l-4 ${
                  isActive
                    ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <span className="text-base flex items-center justify-center w-5 h-5">{tab.icon}</span>
                <span className="flex items-center leading-none">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Column: Content Cards */}
        <div key={currentTab} className="md:col-span-3 animate-tab-fade">
          {/* 1. Security & Password Tab */}
          {currentTab === "security" && (
            <div className="space-y-6">
              <section id="change-password" className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700/60 pb-2">Change Password</h2>

                {passwordMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{passwordMsg}</p>}
                {passwordErr && <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{passwordErr}</p>}

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Current Password</label>
                    <div className="flex gap-2">
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition shrink-0"
                      >
                        {showCurrent ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">New Password</label>
                      <div className="flex gap-2">
                        <input
                          type={showNew ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition shrink-0"
                        >
                          {showNew ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Confirm New Password</label>
                      <div className="flex gap-2">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition shrink-0"
                        >
                          {showConfirm ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {password && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        <span>Password Strength:</span>
                        <span className="capitalize">{strengthInfo.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strengthInfo.color} transition-all duration-300`}
                          style={{ width: `${(strengthInfo.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700/60 pb-2">Two-Factor Authentication & Devices</h2>
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 space-y-1">
                    <span className="block text-[10px] font-bold uppercase text-gray-400">2FA Status</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">Disabled (Standard Password Protection)</span>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 space-y-1">
                    <span className="block text-[10px] font-bold uppercase text-gray-400">Active Login Sessions</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span>🟢</span> 1 Active Session (Current Browser)
                    </span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 2. Preferences Tab */}
          {currentTab === "preferences" && (
            <section id="preferences" className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-6">
              {/* Currency & Region */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/60 pb-2">Currency & Region</h2>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">🌍 Preferred Currency</span>
                    <span className="block text-[10px] text-gray-400 dark:text-gray-400 max-w-md">
                      Choose the currency used to display prices throughout ShopSphere. Product prices are converted automatically using current exchange rates.
                    </span>
                  </div>
                  <div className="shrink-0">
                    <CurrencySelector />
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/60 pb-2">Appearance</h2>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">Theme Mode</span>
                    <span className="block text-[10px] text-gray-400 dark:text-gray-400">Choose between light, dark, or system preferences.</span>
                  </div>
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl">
                    {["light", "dark", "system"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTheme(mode)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${theme === mode ? "bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Communication Preferences */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/60 pb-2">Communication Preferences</h2>
                <div className="mt-3 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailPromo}
                      onChange={(e) => setEmailPromo(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">Promotions & Discounts</span>
                      <span className="block text-[10px] text-gray-400 dark:text-gray-400">Receive emails regarding sales, codes, and coupons.</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailOrder}
                      onChange={(e) => setEmailOrder(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">Order Updates</span>
                      <span className="block text-[10px] text-gray-400 dark:text-gray-400">Receive notifications on order receipts and shipping schedules.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/60 pb-2">Notifications</h2>
                <div className="mt-3 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pushNotify}
                      onChange={(e) => setPushNotify(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">Browser Push Notifications</span>
                      <span className="block text-[10px] text-gray-400 dark:text-gray-400">Receive instant alerts directly in your browser.</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsNotify}
                      onChange={(e) => setSmsNotify(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">SMS Notifications</span>
                      <span className="block text-[10px] text-gray-400 dark:text-gray-400">Receive alerts on your registered phone number.</span>
                    </div>
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* 3. Privacy & Data Tab */}
          {currentTab === "privacy" && (
            <section id="privacy-data" className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/60 pb-2">Privacy & Data Controls</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  You have full ownership of your data on ShopSphere. Download your personal account profile information at any time.
                </p>
                
                {downloadMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-3 animate-fade-in">{downloadMsg}</p>}

                <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                  <button
                    type="button"
                    onClick={handleDownloadData}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    <span>📥</span> Download My Data (.json)
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-2">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Activity Log</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Account session created on {new Date(user?.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. All activity is secured with TLS encryption.
                </p>
              </div>
            </section>
          )}

          {/* 4. Danger Zone Tab */}
          {currentTab === "danger" && (
            <div className="space-y-6">
              <section id="danger-zone" className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/20 p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-red-700 dark:text-red-400 border-b border-red-100 dark:border-red-900/50 pb-2">Danger Zone</h2>
                <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                  <p>
                    Permanently delete your account and all associated order history, profile data, and saved preferences. This action cannot be undone.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-extrabold hover:bg-red-700 transition cursor-pointer"
                    >
                      Delete Account
                    </button>
                    <button
                      type="button"
                      onClick={handleLogoutAllDevices}
                      className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 text-xs font-extrabold hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    >
                      Logout from All Devices
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-extrabold text-red-600 dark:text-red-400">Confirm Account Deletion</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Type <strong className="text-gray-900 dark:text-white">DELETE</strong> to confirm permanent deletion.
            </p>
            {deleteErr && <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{deleteErr}</p>}
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 text-xs text-gray-900 dark:text-white outline-none focus:border-red-500 transition"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer"
              >
                Permanently Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setDeleteErr("");
                }}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
