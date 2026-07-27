import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyOrders, downloadInvoice, cancelOrder } from "../services/orderService";
import { useCurrency } from "../contexts/CurrencyContext";
import CancelOrderModal from "../components/order/CancelOrderModal";
import { ORDER_STATUS, PAYMENT_STATUS, CANCELLABLE_STATUSES } from "../utils/constants";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function OrderHistoryPage() {
  const { convertPrice, formatCurrency } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleCancelConfirm = async (finalReason) => {
    if (!selectedOrder) return;
    await cancelOrder(selectedOrder._id, finalReason);
    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o._id === selectedOrder._id
          ? { ...o, status: ORDER_STATUS.CANCELLED }
          : o
      )
    );
  };

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
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 font-bold border-b border-gray-200">
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
                    <td className="px-4 py-3 font-semibold text-indigo-600">{formatCurrency(convertPrice(Number(order.totalPrice || 0)))}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                        order.status === ORDER_STATUS.DELIVERED ? "bg-emerald-50 text-emerald-700" :
                        order.status === ORDER_STATUS.CANCELLED ? "bg-red-50 text-red-700" :
                        "bg-indigo-50 text-indigo-700"
                      }`}>
                        {(order.status || "PLACED").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {(() => {
                        const statusUpper = (order.status || ORDER_STATUS.PLACED).toUpperCase();
                        const isCancelable = CANCELLABLE_STATUSES.includes(statusUpper);
                        const isCancelled = statusUpper === ORDER_STATUS.CANCELLED;
                        const isRefunded = statusUpper === ORDER_STATUS.REFUNDED;
                        const isCancelledOrRefunded = isCancelled || isRefunded;
                        const isDelivered = statusUpper === ORDER_STATUS.DELIVERED;

                        return (
                          <>
                            {!isCancelledOrRefunded && (
                              <Link
                                to={`/orders/${order._id}/track`}
                                className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700 cursor-pointer"
                              >
                                Track Order
                              </Link>
                            )}
                            <button
                              onClick={() => handleDownload(order._id)}
                              disabled={downloadingId === order._id}
                              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                            >
                              {downloadingId === order._id ? "..." : "Download Invoice"}
                            </button>
                            {isCancelable && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowCancelModal(true);
                                }}
                                className="inline-flex items-center rounded-xl bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 transition border border-red-200 px-3 py-1.5 cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            )}
                            {isDelivered && (
                              <Link
                                to={`/orders/${order._id}`}
                                className="inline-flex items-center rounded-xl bg-purple-50 hover:bg-purple-100 text-xs font-bold text-purple-700 transition border border-purple-200 px-3 py-1.5 cursor-pointer"
                              >
                                Return / Replace
                              </Link>
                            )}
                            {isCancelledOrRefunded && (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border uppercase ${isRefunded ? "bg-teal-50 text-teal-700 border-teal-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                                {isRefunded ? "Refunded" : "Cancelled"}
                              </span>
                            )}
                          </>
                        );
                      })()}
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
                    <p className="font-bold text-indigo-600">{formatCurrency(convertPrice(Number(order.totalPrice || 0)))}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    order.status === ORDER_STATUS.DELIVERED ? "bg-emerald-50 text-emerald-700" :
                    order.status === ORDER_STATUS.CANCELLED ? "bg-red-50 text-red-700" :
                    "bg-indigo-50 text-indigo-700"
                  }`}>
                    {(order.status || "PLACED").replace(/_/g, " ")}
                  </span>
                  
                  {(() => {
                    const statusUpper = (order.status || ORDER_STATUS.PLACED).toUpperCase();
                    const isCancelable = CANCELLABLE_STATUSES.includes(statusUpper);
                    const isCancelled = statusUpper === ORDER_STATUS.CANCELLED;
                    const isRefunded = statusUpper === ORDER_STATUS.REFUNDED;
                    const isCancelledOrRefunded = isCancelled || isRefunded;
                    const isDelivered = statusUpper === ORDER_STATUS.DELIVERED;

                    return (
                      <div className="flex gap-2 items-center flex-wrap justify-end">
                        {!isCancelledOrRefunded && (
                          <Link
                            to={`/orders/${order._id}/track`}
                            className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-indigo-700"
                          >
                            Track
                          </Link>
                        )}
                        <button
                          onClick={() => handleDownload(order._id)}
                          disabled={downloadingId === order._id}
                          className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-[10px] font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          {downloadingId === order._id ? "..." : "Download Invoice"}
                        </button>
                        {isCancelable && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowCancelModal(true);
                            }}
                            className="inline-flex items-center rounded-xl bg-red-50 hover:bg-red-100 text-[10px] font-bold text-red-700 transition border border-red-200 px-3 py-1.5 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        {isDelivered && (
                          <Link
                            to={`/orders/${order._id}`}
                            className="inline-flex items-center rounded-xl bg-purple-50 hover:bg-purple-100 text-[10px] font-bold text-purple-700 transition border border-purple-200 px-3 py-1.5 cursor-pointer"
                          >
                            Return/Replace
                          </Link>
                        )}
                        {isCancelledOrRefunded && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${isRefunded ? "bg-teal-50 text-teal-700 border-teal-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                            {isRefunded ? "Refunded" : "Cancelled"}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}

export default OrderHistoryPage;
