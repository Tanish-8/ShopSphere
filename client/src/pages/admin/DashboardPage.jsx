import { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/adminService";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getDashboardStats();
        if (mounted) setStats(data);
      } catch (e) {
        // ignore for now
      }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="mt-2 text-xl font-semibold">${(stats?.totalRevenue || 0).toFixed(2)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Total Orders</div>
          <div className="mt-2 text-xl font-semibold">{stats?.totalOrders ?? 0}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Total Products</div>
          <div className="mt-2 text-xl font-semibold">{stats?.totalProducts ?? 0}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="mt-2 text-xl font-semibold">{stats?.totalUsers ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
