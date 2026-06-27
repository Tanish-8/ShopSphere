import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useTheme from "../hooks/useTheme";
import { updateProfile } from "../services/authService";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "personal";

  // Personal Info Form
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [personalMsg, setPersonalMsg] = useState("");
  const [personalErr, setPersonalErr] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);

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
  const [language, setLanguage] = useState("en-US");

  // Modal dialog toggles
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteErr, setDeleteErr] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleUpdatePersonal = async (e) => {
    e.preventDefault();
    setPersonalMsg("");
    setPersonalErr("");
    setSavingPersonal(true);
    try {
      await updateProfile({ name, email, phone });
      setPersonalMsg("Personal information updated successfully.");
    } catch (err) {
      setPersonalErr(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingPersonal(false);
    }
  };

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

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "None", color: "bg-gray-200" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Medium", color: "bg-amber-500" };
    return { score, label: "Strong", color: "bg-emerald-500" };
  };

  const strengthInfo = getPasswordStrength(password);

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteErr("Please type 'DELETE' to confirm account deletion.");
      return;
    }
    logout();
    navigate("/");
  };

  const tabs = [
    { id: "personal", label: "Personal Information", icon: "👤" },
    { id: "security", label: "Security & Password", icon: "🔑" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "danger", label: "Danger Zone", icon: "🚨" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 text-left pb-16">
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-xs text-gray-500 font-medium">Manage your profile, account security, and notification preferences.</p>
      </div>

      {/* Mobile Navigation segmented horizontal row */}
      <div className="flex md:hidden gap-1.5 bg-gray-100 p-1 rounded-xl overflow-x-auto select-none mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              currentTab === tab.id
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.icon} {tab.label.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-4 items-start">
        {/* Left Column: Premium Sidebar layout */}
        <aside className="hidden md:block col-span-1 space-y-1.5 bg-white border border-gray-150 p-2.5 rounded-2xl shadow-xs">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`w-full h-11 flex items-center gap-3.5 px-3.5 text-xs font-bold rounded-xl transition text-left cursor-pointer border-l-4 ${
                  isActive
                    ? "border-indigo-650 bg-indigo-50/30 text-indigo-700 font-bold"
                    : "border-transparent text-gray-500 hover:bg-gray-50/50 hover:text-gray-900"
                }`}
              >
                <span className="text-base flex items-center justify-center w-5 h-5">{tab.icon}</span>
                <span className="flex items-center leading-none">{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Column: Content Card (takes 75% width) */}
        <div key={currentTab} className="md:col-span-3 animate-tab-fade">
          {currentTab === "personal" && (
            <section id="personal-info" className="rounded-2xl border border-gray-150 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Personal Information</h2>
              
              {personalMsg && <p className="text-xs text-emerald-600 font-semibold">{personalMsg}</p>}
              {personalErr && <p className="text-xs text-red-600 font-semibold">{personalErr}</p>}

              <form onSubmit={handleUpdatePersonal} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    required
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Optional"
                      className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingPersonal}
                  className="btn-primary mt-2"
                >
                  {savingPersonal ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </section>
          )}

          {currentTab === "security" && (
            <section id="change-password" className="rounded-2xl border border-gray-150 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Security & Password</h2>

              {passwordMsg && <p className="text-xs text-emerald-600 font-semibold">{passwordMsg}</p>}
              {passwordErr && <p className="text-xs text-red-600 font-semibold">{passwordErr}</p>}

              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Current Password</label>
                  <div className="flex gap-2">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="btn-small shrink-0"
                    >
                      {showCurrent ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">New Password</label>
                    <div className="flex gap-2">
                      <input
                        type={showNew ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="btn-small shrink-0"
                      >
                        {showNew ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Confirm New Password</label>
                    <div className="flex gap-2">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="btn-small shrink-0"
                      >
                        {showConfirm ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>

                {password && (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                      <span>Password Strength:</span>
                      <span className="capitalize">{strengthInfo.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
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
                  className="btn-primary mt-2"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </section>
          )}

          {currentTab === "preferences" && (
            <section id="preferences" className="rounded-2xl border border-gray-150 bg-white p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Appearance</h2>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-800 font-bold">Theme Mode</span>
                    <span className="block text-[10px] text-gray-400">Choose between light, dark, or system preferences.</span>
                  </div>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    {["light", "dark", "system"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTheme(mode)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${theme === mode ? "bg-white text-indigo-700 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Language Preference</h2>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-800 font-bold">Language / Locale</span>
                    <span className="block text-[10px] text-gray-400">Choose your preferred display language.</span>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 outline-none cursor-pointer h-10"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español (ES)</option>
                    <option value="fr-FR">Français (FR)</option>
                  </select>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Communication Preferences</h2>
                <div className="mt-3 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailPromo}
                      onChange={(e) => setEmailPromo(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-gray-800">Promotions & Discounts</span>
                      <span className="block text-[10px] text-gray-400">Receive emails regarding sales, codes, and coupons.</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailOrder}
                      onChange={(e) => setEmailOrder(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-gray-800">Order Updates</span>
                      <span className="block text-[10px] text-gray-400">Receive notifications on order receipts and shipping schedules.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Notifications</h2>
                <div className="mt-3 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pushNotify}
                      onChange={(e) => setPushNotify(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-gray-800">Browser Push Notifications</span>
                      <span className="block text-[10px] text-gray-400">Receive instant alerts directly in your browser.</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsNotify}
                      onChange={(e) => setSmsNotify(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-gray-800">SMS Notifications</span>
                      <span className="block text-[10px] text-gray-400">Receive alerts on your registered phone number.</span>
                    </div>
                  </label>
                </div>
              </div>
            </section>
          )}

          {currentTab === "danger" && (
            <section id="danger-zone" className="rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-red-700 border-b border-red-150 pb-2">Danger Zone</h2>
              <p className="text-xs text-gray-600 font-medium">
                Permanently delete your user profile account and clear all historical orders list data. This action is irreversible.
              </p>
              <button
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeleteErr("");
                  setShowDeleteModal(true);
                }}
                className="btn-danger"
              >
                Delete Account
              </button>
            </section>
          )}
        </div>
      </div>

      {/* Delete account Modal Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-dropdown">
          <div className="w-full max-w-sm rounded-2xl border border-gray-150 bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Are you absolutely sure?</h3>
            <p className="text-xs text-gray-500">
              This action cannot be undone. To proceed, please type <strong className="text-red-600">DELETE</strong> in the box below:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-xs outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
            {deleteErr && <p className="text-[10px] text-red-600 font-semibold">{deleteErr}</p>}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn-danger"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
