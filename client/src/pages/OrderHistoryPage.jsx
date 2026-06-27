import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyOrders, downloadInvoice } from "../services/orderService";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchMyOrders();
        if (mounted) {
          setOrders(data);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError?.response?.data?.message || requestError?.message || "Failed to load orders.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDownload = async (orderId) => {
    setDownloadingId(orderId);
    try {
      const data = await downloadInvoice(orderId);
      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download PDF invoice.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">Loading orders...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700 shadow-sm">{error}</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-2 text-sm text-gray-600">Track and review your previous orders.</p>
      </header>

      {orders.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">
          No orders found yet.
        </section>
      ) : (
        <>
          {/* Desktop Table */}
          <section className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 font-bold border-b border-gray-150">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <Link to={`/orders/${order._id}`} className="text-indigo-600 hover:underline">
                        {order._id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">${Number(order.totalPrice || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-indigo-700">
                        {order.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/orders/${order._id}/track`}
                        className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1.5 text-2xs font-bold text-white transition hover:bg-indigo-700 cursor-pointer"
                      >
                        Track Order
                      </Link>
                      <button
                        onClick={() => handleDownload(order._id)}
                        disabled={downloadingId === order._id}
                        className="inline-flex items-center rounded-xl border border-gray-350 bg-white px-3 py-1.5 text-2xs font-bold text-gray-700 transition hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                      >
                        {downloadingId === order._id ? "..." : "Invoice"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Mobile Card List */}
          <section className="space-y-3 md:hidden">
            {orders.map((order) => (
              <article key={order._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 text-left">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Order ID</p>
                  <Link to={`/orders/${order._id}`} className="mt-0.5 block break-all text-xs font-semibold text-indigo-600 hover:underline">
                    {order._id}
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Date</p>
                    <p className="font-semibold text-gray-700">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Total</p>
                    <p className="font-bold text-indigo-600">${Number(order.totalPrice || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                  <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-700">
                    {order.status || "pending"}
                  </span>
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/orders/${order._id}/track`}
                      className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-indigo-700"
                    >
                      Track
                    </Link>
                    <button
                      onClick={() => handleDownload(order._id)}
                      disabled={downloadingId === order._id}
                      className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-[10px] font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      {downloadingId === order._id ? "..." : "Invoice"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export default OrderHistoryPage;
