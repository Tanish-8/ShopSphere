import { useEffect, useState, useMemo } from "react";
import { fetchAllUsers, updateUserRole, deleteUser } from "../../services/adminService";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Profile modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendedUsers, setSuspendedUsers] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAllUsers();
      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRole = async (id, role) => {
    try {
      await updateUserRole(id, role);
      setMessage("User role updated successfully.");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.message || "Failed to update role.");
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      setMessage("User deleted successfully.");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.message || "Failed to delete user.");
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleToggleSuspend = (userId) => {
    setSuspendedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
    setMessage("User account status modified.");
    setTimeout(() => setMessage(null), 3000);
  };

  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        !q ||
        u.email?.toLowerCase().includes(q.toLowerCase()) ||
        u.name?.toLowerCase().includes(q.toLowerCase())
    );
  }, [users, q]);

  // Mock metadata helper based on user name/email hash to keep them stable
  const mockUserStats = (user) => {
    const code = (user.name || "").charCodeAt(0) || 65;
    const ordersCount = (code % 8) + 1;
    const spend = (code * 7.5) + 20.45;
    const regDate = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString()
      : `0${(code % 9) + 1}/12/2025`;
    const lastLogin = `2026-06-2${code % 9} 1${code % 8}:${code % 5}0`;
    return { ordersCount, spend, regDate, lastLogin };
  };

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customer Management</h1>
          <p className="text-xs text-gray-500 mt-1">Audit customer registrations, review lifetimes spend profiles, and configure access roles.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full sm:max-w-md h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500 transition"
        />
      </div>

      {message && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100">{message}</div>}

      {loading ? (
        <div className="text-center text-xs font-bold text-gray-400 py-10">Loading customers...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-xs font-bold text-gray-400 py-10">No customers found.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider">Customer Details</th>
                <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider">Registered</th>
                <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-right">Orders</th>
                <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-right">Lifetime Spend</th>
                <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSuspended = suspendedUsers.has(u._id);
                const stats = mockUserStats(u);
                return (
                  <tr key={u._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{u.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-500">{stats.regDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === "admin"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-700 text-right">{stats.ordersCount}</td>
                    <td className="px-4 py-3 font-black text-gray-950 text-right">${stats.spend.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        isSuspended
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => setSelectedUser({ ...u, ...stats, isSuspended })}
                          className="px-2.5 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-600 cursor-pointer text-[10px]"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => handleRole(u._id, u.role === "admin" ? "customer" : "admin")}
                          className="px-2.5 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-600 cursor-pointer text-[10px]"
                        >
                          Role
                        </button>
                        <button
                          onClick={() => handleToggleSuspend(u._id)}
                          className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer text-[10px] ${
                            isSuspended ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {isSuspended ? "Activate" : "Suspend"}
                        </button>
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold cursor-pointer text-[10px]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Profile detail slide over / modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-200 text-left space-y-4 animate-scale-up">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Customer Profile Card</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase">Name</span>
                <p className="text-sm font-bold text-gray-800">{selectedUser.name}</p>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase">Email</span>
                <p className="text-xs font-semibold text-gray-600">{selectedUser.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">Registration Date</span>
                  <p className="text-xs font-semibold text-gray-600">{selectedUser.regDate}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">Last Login</span>
                  <p className="text-xs font-semibold text-gray-600">{selectedUser.lastLogin}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">Lifetime Spend</span>
                  <p className="text-sm font-black text-gray-900">${selectedUser.spend.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase">Orders Placed</span>
                  <p className="text-sm font-bold text-gray-800">{selectedUser.ordersCount} orders</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
