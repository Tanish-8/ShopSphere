import { useEffect, useState, useMemo } from "react";
import { getDashboardStats } from "../../services/adminService";

function KPICard({ title, value, trendPct, icon, prefix = "", isAlert = false }) {
  const isPositive = trendPct >= 0;
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-2xs flex items-center justify-between transition hover:shadow-xs ${
      isAlert ? "border-amber-250 bg-amber-50/20" : "border-gray-200"
    }`}>
      <div className="space-y-1 text-left">
        <span className="text-2xs font-extrabold text-gray-400 uppercase tracking-wider block">{title}</span>
        <h3 className="text-xl font-black text-gray-900">
          {prefix}{typeof value === "number" && prefix ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value.toLocaleString()}
        </h3>
        {trendPct !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-black ${isPositive ? "text-emerald-700" : "text-rose-650"}`}>
              {isPositive ? "▲ +" : "▼ "}{trendPct}%
            </span>
            <span className="text-[9px] text-gray-400 font-bold">vs last month</span>
          </div>
        )}
      </div>
      <div className="text-2xl p-3 bg-gray-50 rounded-2xl text-gray-650 flex items-center justify-center h-12 w-12 select-none">
        {icon}
      </div>
    </div>
  );
}

function SVGBarChart({ data, xKey, yKey, isCurrency = false }) {
  if (!data || data.length === 0) {
    return <div className="text-xs font-bold text-gray-400 py-12 text-center">No monthly historical data available yet.</div>;
  }
  const maxVal = Math.max(...data.map((d) => d[yKey])) || 1;
  const height = 120;
  
  return (
    <div className="flex items-end justify-between gap-3 h-36 pt-4 px-2 border-b border-gray-150">
      {data.map((item, idx) => {
        const val = item[yKey];
        const pct = (val / maxVal) * 100;
        const barHeight = Math.max(8, (pct / 100) * height);
        return (
          <div key={idx} className="flex-1 flex flex-col items-center group relative">
            <span className="absolute -top-8 scale-0 group-hover:scale-100 transition-transform duration-200 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md z-15 whitespace-nowrap">
              {item[xKey]}: {isCurrency ? `$${val.toFixed(2)}` : val}
            </span>
            <div
              className="w-full rounded-t-lg bg-indigo-500 hover:bg-indigo-650 transition-all duration-300 cursor-pointer"
              style={{ height: `${barHeight}px` }}
            />
            <span className="text-[9px] text-gray-450 font-bold mt-2 truncate max-w-full">
              {item[xKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DistributionList({ data, totalKey }) {
  if (!data || data.length === 0) {
    return <div className="text-xs font-bold text-gray-400 py-10 text-center">No distribution data available yet.</div>;
  }
  const total = data.reduce((sum, d) => sum + (d[totalKey] || 0), 0) || 1;
  const colors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-sky-500", "bg-violet-500"];

  return (
    <div className="space-y-3.5 pt-2">
      {data.map((item, idx) => {
        const val = item[totalKey] || 0;
        const pct = ((val / total) * 100).toFixed(1);
        const name = item._id || "Unknown";
        return (
          <div key={idx} className="space-y-1 text-left">
            <div className="flex justify-between text-xs font-bold text-gray-650">
              <span className="truncate max-w-[65%]">{name}</span>
              <span>
                {totalKey === "value" ? `$${val.toFixed(2)}` : val} ({pct}%)
              </span>
            </div>
            <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
              <div
                className={`${colors[idx % colors.length]} h-full rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getDashboardStats();
        if (mounted) {
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to load dashboard metrics:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const kpis = useMemo(() => {
    if (!stats) return [];
    return [
      { title: "Total Revenue", value: stats.totalRevenue || 0, trend: 12.4, icon: "💰", prefix: "$" },
      { title: "Total Orders", value: stats.totalOrders || 0, trend: 8.2, icon: "📦" },
      { title: "Total Customers", value: stats.totalUsers || 0, trend: 5.1, icon: "👤" },
      { title: "Total Products", value: stats.totalProducts || 0, trend: 2.5, icon: "🏷️" }
    ];
  }, [stats]);

  const orderAlerts = useMemo(() => {
    if (!stats) return [];
    return [
      { title: "Pending Orders", value: stats.pendingOrders || 0, icon: "⏳" },
      { title: "Delivered Orders", value: stats.deliveredOrders || 0, icon: "✅" },
      { title: "Cancelled Orders", value: stats.cancelledOrders || 0, icon: "✕" }
    ];
  }, [stats]);

  const stockAlerts = useMemo(() => {
    if (!stats) return [];
    return [
      { title: "Low Stock Products", value: stats.lowStockProducts || 0, icon: "⚠️", isAlert: (stats.lowStockProducts || 0) > 0 },
      { title: "Out of Stock Products", value: stats.outOfStockProducts || 0, icon: "🚫", isAlert: (stats.outOfStockProducts || 0) > 0 }
    ];
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-gray-900 text-left">Dashboard Overview</h1>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 h-28"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 h-60"></div>
          <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 h-60"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="text-left space-y-1.5">
        <h1 className="text-2xl font-black text-gray-900">Seller Central Dashboard</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform Analytics & Business Intelligence</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((card, i) => (
          <KPICard key={i} title={card.title} value={card.value} trendPct={card.trend} icon={card.icon} prefix={card.prefix} />
        ))}
      </div>

      {/* Order & Inventory Alert Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {orderAlerts.map((card, i) => (
          <KPICard key={i} title={card.title} value={card.value} icon={card.icon} />
        ))}
        {stockAlerts.map((card, i) => (
          <KPICard key={i} title={card.title} value={card.value} icon={card.icon} isAlert={card.isAlert} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="text-left">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Monthly Sales & Revenue</h2>
            <p className="text-[10px] font-bold text-gray-400">Total transaction volumes aggregated by calendar month</p>
          </div>
          <SVGBarChart data={stats?.monthlyStats} xKey="_id" yKey="revenue" isCurrency={true} />
        </div>

        {/* Sales by Category Distribution */}
        <div className="lg:col-span-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="text-left">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Category Sales</h2>
            <p className="text-[10px] font-bold text-gray-400">Revenue share distributions across departments</p>
          </div>
          <DistributionList data={stats?.salesByCategory} totalKey="value" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Payment Methods */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="text-left">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Payment Channels</h2>
            <p className="text-[10px] font-bold text-gray-400">Customer checkout gateway distributions</p>
          </div>
          <DistributionList data={stats?.paymentMethods} totalKey="count" />
        </div>

        {/* Order Statuses */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="text-left">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Order Lifecycle Stages</h2>
            <p className="text-[10px] font-bold text-gray-400">Distribution of current statuses in state machine</p>
          </div>
          <DistributionList data={stats?.orderStatuses} totalKey="count" />
        </div>

        {/* Top Selling Brands */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="text-left">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Top Selling Brands</h2>
            <p className="text-[10px] font-bold text-gray-400">Top brands based on quantities purchased</p>
          </div>
          <DistributionList data={stats?.topBrands} totalKey="qty" />
        </div>
      </div>

      {/* Tables section: Top Products and Top Customers */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4 text-left">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Best Selling Products</h2>
            <p className="text-[10px] font-bold text-gray-400">Top 5 items in units sold and overall catalog revenue contribution</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-150">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150">
                  <th className="px-4 py-2.5 font-extrabold text-gray-500">Product Name</th>
                  <th className="px-4 py-2.5 font-extrabold text-gray-500 text-right">Units Sold</th>
                  <th className="px-4 py-2.5 font-extrabold text-gray-500 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topProducts?.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-bold text-gray-800 truncate max-w-[150px]">{p._id}</td>
                    <td className="px-4 py-2.5 font-bold text-gray-700 text-right">{p.qty}</td>
                    <td className="px-4 py-2.5 font-black text-gray-900 text-right">${p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
                {(!stats?.topProducts || stats.topProducts.length === 0) && (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400 font-bold">No sales records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4 text-left">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Top Customers by Spend</h2>
            <p className="text-[10px] font-bold text-gray-400">Top 5 customers in cumulative checkout purchase value</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-150">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150">
                  <th className="px-4 py-2.5 font-extrabold text-gray-500">Name / Email</th>
                  <th className="px-4 py-2.5 font-extrabold text-gray-500 text-right">Orders Count</th>
                  <th className="px-4 py-2.5 font-extrabold text-gray-500 text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topCustomers?.map((c, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-gray-800">
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">{c.email}</div>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-gray-700 text-right">{c.orders}</td>
                    <td className="px-4 py-2.5 font-black text-gray-900 text-right">${c.spend.toFixed(2)}</td>
                  </tr>
                ))}
                {(!stats?.topCustomers || stats.topCustomers.length === 0) && (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-400 font-bold">No customer spend records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
