import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyOrders, downloadInvoice } from "../services/orderService";

export default function InvoicesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchMyOrders();
        if (mounted) setOrders(data);
      } catch (err) {
        if (mounted) setError("Failed to fetch order history.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDownload = async (orderId) => {
    setDownloadingId(orderId);
    setDownloadError("");
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
      setDownloadError("Failed to download PDF invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getFriendlyInvoiceNumber = (order) => {
    const idStr = order._id || order.id || "";
    return `INV-${idStr.slice(-6).toUpperCase()}`;
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter((order) => {
    const orderId = (order._id || order.id || "").toLowerCase();
    const invoiceNum = getFriendlyInvoiceNumber(order).toLowerCase();
    
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = orderId.includes(query) || invoiceNum.includes(query);

    if (!matchesSearch) return false;
    if (filterStatus === "All") return true;
    
    const isPaid = order.isPaid || order.paymentStatus?.toLowerCase() === "paid";
    const isCancelled = order.status?.toLowerCase() === "cancelled";
    const isPending = !isPaid && !isCancelled;

    if (filterStatus === "Paid") return isPaid;
    if (filterStatus === "Pending") return isPending;
    if (filterStatus === "Cancelled") return isCancelled;

    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm font-semibold text-gray-500">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading invoices...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">My Invoices</h1>
        <p className="text-xs text-gray-500 mt-1">Download PDF receipts for your historical purchases.</p>
      </div>

      {downloadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          {downloadError}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-gray-150 bg-white py-14 px-6 text-center shadow-xs">
          <div className="text-4xl">📄</div>
          <h2 className="mt-4 text-lg font-bold text-gray-800">No invoices available yet</h2>
          <p className="mt-2 text-xs text-gray-500 max-w-sm mx-auto">
            You haven't placed any orders yet, so there are no billing invoices generated.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-gray-150 p-4 rounded-2xl shadow-xs">
            {/* Search */}
            <div className="relative flex items-center w-full sm:max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Order ID / Invoice..."
                className="w-full h-11 rounded-xl border border-gray-300 bg-gray-50 pl-[46px] pr-4 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <svg
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                style={{ width: "18px", height: "18px" }}
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3a6 6 0 104.472 10.001l3.263 3.264a1 1 0 001.414-1.414l-3.264-3.263A6 6 0 009 3zm-4 6a4 4 0 118 0 4 4 0 01-8 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              {["All", "Paid", "Pending", "Cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${filterStatus === status ? "bg-white text-indigo-700 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Results check */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-gray-150 bg-white py-14 px-6 text-center shadow-xs">
              <div className="text-3xl">🔍</div>
              <h2 className="mt-4 text-base font-bold text-gray-800">No matching invoices found</h2>
              <p className="mt-2 text-xs text-gray-500">
                Try revising your query or category filters.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-150 bg-white shadow-xs">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-500">
                      <th className="px-6 py-4">Invoice Number</th>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Order Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Total Price</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => {
                      const isPaid = order.isPaid || order.paymentStatus?.toLowerCase() === "paid";
                      const isCancelled = order.status?.toLowerCase() === "cancelled";
                      
                      return (
                        <tr key={order._id || order.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {getFriendlyInvoiceNumber(order)}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-500 font-mono text-xs select-all">
                            {order._id || order.id}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${isPaid ? "bg-emerald-50 text-emerald-700" : isCancelled ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                              {isPaid ? "Paid" : isCancelled ? "Cancelled" : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            ${Number(order.totalPrice || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDownload(order._id || order.id)}
                              disabled={downloadingId === (order._id || order.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 font-bold text-indigo-600 shadow-3xs transition hover:bg-indigo-50 cursor-pointer disabled:opacity-50"
                            >
                              {downloadingId === (order._id || order.id) ? (
                                <svg className="animate-spin h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              )}
                              Download
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const isPaid = order.isPaid || order.paymentStatus?.toLowerCase() === "paid";
                  const isCancelled = order.status?.toLowerCase() === "cancelled";
                  const idStr = order._id || order.id;

                  return (
                    <div key={idStr} className="p-4 space-y-3 bg-white text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-gray-900">{getFriendlyInvoiceNumber(order)}</h3>
                          <p className="text-[9px] text-gray-400 font-mono mt-0.5 select-all">{idStr}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${isPaid ? "bg-emerald-50 text-emerald-700" : isCancelled ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                          {isPaid ? "Paid" : isCancelled ? "Cancelled" : "Pending"}
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-600 font-medium">
                        <span>Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: "short" }) : "-"}</span>
                        <span className="font-bold text-gray-900">Total: ${Number(order.totalPrice || 0).toFixed(2)}</span>
                      </div>

                      <div className="pt-2 border-t border-gray-50 flex justify-end">
                        <button
                          onClick={() => handleDownload(idStr)}
                          disabled={downloadingId === idStr}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white py-2 font-bold text-indigo-600 shadow-3xs transition hover:bg-indigo-50 cursor-pointer disabled:opacity-50"
                        >
                          {downloadingId === idStr ? (
                            <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                          Download PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
