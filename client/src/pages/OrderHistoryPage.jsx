import { useEffect, useState } from "react";
import { fetchMyOrders } from "../services/orderService";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">Loading orders...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700 shadow-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">
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
          <section className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-800">{order._id}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">${Number(order.totalPrice || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">
                        {order.status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="space-y-3 md:hidden">
            {orders.map((order) => (
              <article key={order._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase text-gray-500">Order ID</p>
                <p className="mt-1 break-all text-sm font-medium text-gray-800">{order._id}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium text-gray-800">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-semibold text-indigo-600">${Number(order.totalPrice || 0).toFixed(2)}</p>
                  </div>
                </div>
                <span className="mt-3 inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">
                  {order.status || "pending"}
                </span>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export default OrderHistoryPage;
