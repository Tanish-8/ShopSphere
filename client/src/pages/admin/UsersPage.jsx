import { useEffect, useState } from "react";
import { fetchAllUsers } from "../../services/adminService";
import { updateUserRole, deleteUser } from "../../services/adminService";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const list = await fetchAllUsers();
    setUsers(list);
  };

  useEffect(() => { load(); }, []);

  const handleRole = async (id, role) => {
    await updateUserRole(id, role);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    await deleteUser(id);
    load();
  };

  const filtered = users.filter(u => !q || u.email.includes(q) || u.name.includes(q));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
      <div className="mb-4"><input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search by name or email" className="rounded border px-3 py-2" /></div>
      <div className="space-y-3">
        {filtered.map(u => (
          <div key={u._id} className="flex items-center justify-between rounded border bg-white p-3">
            <div>
              <div className="font-medium">{u.name} <span className="text-sm text-gray-500">({u.email})</span></div>
              <div className="text-sm text-gray-500">Role: {u.role}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleRole(u._id, u.role === 'admin' ? 'customer' : 'admin')} className="px-3 py-1 rounded border">Toggle Role</button>
              <button onClick={() => handleDelete(u._id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
