import { useEffect, useState } from "react";
import { fetchAllOrders, updateOrderStatus, downloadInvoice, adminProcessRefund } from "../../services/orderService";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  
  // Search & Filter States
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Expanded timeline trackers per order ID
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  // Refund Modal States
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    try {
      const resp = await fetchAllOrders();
      setOrders(resp.data || resp);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleExpandOrder = (orderId) => {
    const next = new Set(expandedOrders);
    if (next.has(orderId)) {
      next.delete(orderId);
    } else {
      next.add(orderId);
    }
    setExpandedOrders(next);
  };

  const handleUpdate = async (orderId, toStatus, note = "Updated via admin panel") => {
    try {
      await updateOrderStatus(orderId, toStatus, note);
      load();
    } catch (e) { alert(e?.response?.data?.message || e.message); }
  };

  const handleDownloadInvoice = async (orderId) => {
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
      alert("Failed to download invoice PDF.");
    }
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await adminProcessRefund(selectedOrder._id, {
        refundAmount,
        method: refundMethod,
        upiId,
        bankAccount,
        bankIfsc,
      });
      setShowRefundModal(false);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to process refund.");
    } finally {
      setProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Search & Filter Logic
  // ---------------------------------------------------------------------------
  const applyFilter = (o) => {
    // Search by ID, Customer Name, Email
    if (q) {
      const query = q.toLowerCase();
      const idMatch = o._id.toLowerCase().includes(query);
      const nameMatch = o.user?.name?.toLowerCase().includes(query);
      const emailMatch = o.user?.email?.toLowerCase().includes(query);
      if (!idMatch && !nameMatch && !emailMatch) return false;
    }
    // Filter by Order Status
    if (statusFilter && o.status !== statusFilter) return false;
    // Filter by Payment Status
    if (paymentFilter) {
      const isPaidCheck = paymentFilter === "paid";
      const isRefundedCheck = paymentFilter === "refunded";
      const isProcessingCheck = paymentFilter === "Refund Processing";
      const isUnpaidCheck = paymentFilter === "unpaid";

      if (isPaidCheck && !o.isPaid) return false;
      if (isRefundedCheck && o.paymentStatus !== "refunded") return false;
      if (isProcessingCheck && o.paymentStatus !== "Refund Processing") return false;
      if (isUnpaidCheck && (o.isPaid || o.paymentStatus === "refunded")) return false;
    }
    // Filter by Date
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      const orderDate = new Date(o.createdAt).toDateString();
      if (filterDate !== orderDate) return false;
    }

    return true;
  };

  // ---------------------------------------------------------------------------
  // Statistics Calculations
  // ---------------------------------------------------------------------------
  const stats = {
    pending: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returns: 0,
    refunds: 0,
  };

  orders.forEach((o) => {
    const status = (o.status || "").toLowerCase();
    if (["placed", "confirmed"].includes(status)) stats.pending++;
    else if (status === "packed") stats.packed++;
    else if (["shipped", "out for delivery"].includes(status)) stats.shipped++;
    else if (status === "delivered") stats.delivered++;
    else if (status === "cancelled") stats.cancelled++;
    else if (status.startsWith("return")) stats.returns++;
    else if (status.startsWith("refund")) stats.refunds++;
  });

  return (
    <div className="space-y-6 text-left pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Admin Orders Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1">Audit transactions, manage return request claims, and issue payment refunds.</p>
      </div>

      {/* Statistics Panels */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase text-gray-400">Pending</p>
          <p className="text-xl font-extrabold text-indigo-650">{stats.pending}</p>
        </div>
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase text-gray-400">Packed</p>
          <p className="text-xl font-extrabold text-yellow-600">{stats.packed}</p>
        </div>
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase text-gray-400">Shipped</p>
          <p className="text-xl font-extrabold text-blue-600">{stats.shipped}</p>
        </div>
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase text-gray-400">Delivered</p>
          <p className="text-xl font-extrabold text-emerald-600">{stats.delivered}</p>
        </div>
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase text-gray-400">Cancelled</p>
          <p className="text-xl font-extrabold text-red-600">{stats.cancelled}</p>
        </div>
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase text-gray-400">Returns</p>
          <p className="text-xl font-extrabold text-purple-600">{stats.returns}</p>
        </div>
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase text-gray-400">Refunds</p>
          <p className="text-xl font-extrabold text-pink-600">{stats.refunds}</p>
        </div>
      </div>

      {/* Advanced Filters Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-gray-150 p-4 rounded-2xl shadow-3xs">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ID, Customer, Email..."
            className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider">Order Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer font-semibold text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="Placed">Placed</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Out For Delivery">Out For Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Return Requested">Return Requested</option>
            <option value="Return Approved">Return Approved</option>
            <option value="Returned">Returned</option>
            <option value="Refund Processing">Refund Processing</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider">Payment Status</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer font-semibold text-gray-700"
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="Refund Processing">Refund Processing</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider">Order Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer font-semibold text-gray-700"
          />
        </div>
      </div>

      {/* Orders Listing Grid */}
      <div className="space-y-3.5">
        {orders.filter(applyFilter).length === 0 ? (
          <div className="rounded-2xl border border-gray-150 bg-white py-12 text-center text-xs font-semibold text-gray-400">
            No matching orders found.
          </div>
        ) : (
          orders.filter(applyFilter).map((o) => {
            const isExpanded = expandedOrders.has(o._id);
            const isCancelable = ["placed", "confirmed", "packed"].includes((o.status || "").toLowerCase());
            const isReturnRequested = (o.status || "").toLowerCase() === "return requested";
            const isReturnApproved = (o.status || "").toLowerCase() === "return approved";
            const isRefundable = ((o.status === "Cancelled" && o.paymentStatus === "Refund Processing") ||
              ["Return Requested", "Return Approved", "Returned", "Refund Processing"].includes(o.status)) && o.paymentStatus !== "refunded";

            return (
              <div key={o._id} className="rounded-2xl border border-gray-150 bg-white shadow-3xs hover:border-gray-300 transition overflow-hidden">
                {/* Main Order Card Body */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-left space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900 select-all">{o._id}</span>
                      <span className="text-[10px] text-gray-400 font-bold">&bull; {new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="text-[10px] font-semibold text-gray-500 space-y-0.5 leading-normal">
                      <p>Customer: <span className="font-bold text-gray-800">{o.user?.name || "Deleted User"}</span> &bull; {o.user?.email}</p>
                      <p>Total: <span className="font-bold text-gray-800">${Number(o.totalPrice || 0).toFixed(2)}</span> &bull; Method: <span className="uppercase">{o.paymentMethod}</span></p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold border uppercase ${
                          o.isPaid || o.paymentStatus === "paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : o.paymentStatus === "refunded"
                            ? "bg-teal-50 text-teal-700 border-teal-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          {o.paymentStatus || (o.isPaid ? "Paid" : "Unpaid")}
                        </span>
                        <span className="inline-flex items-center rounded bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                          {o.status || "Placed"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 justify-end">
                    
                    {/* Status Dropdown */}
                    <select
                      value={o.status || "Placed"}
                      onChange={(e) => handleUpdate(o._id, e.target.value)}
                      className="h-9 rounded-xl border border-gray-300 bg-white px-2.5 text-[10px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-150 cursor-pointer"
                    >
                      <option value="Placed">Placed</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out For Delivery">Out For Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Return Requested">Return Requested</option>
                      <option value="Return Approved">Return Approved</option>
                      <option value="Returned">Returned</option>
                      <option value="Refund Processing">Refund Processing</option>
                      <option value="Refunded">Refunded</option>
                    </select>

                    {/* Timeline Expansion Toggle */}
                    <button
                      onClick={() => toggleExpandOrder(o._id)}
                      className="h-9 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-[10px] font-bold text-gray-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <span>⏱️</span> {isExpanded ? "Hide Timeline" : "Timeline"}
                    </button>

                    <button
                      onClick={() => handleDownloadInvoice(o._id)}
                      className="h-9 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-[10px] font-bold text-gray-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <span>📥</span> Invoice
                    </button>

                    {/* Direct Dynamic Actions */}
                    {isCancelable && (
                      <button
                        onClick={() => handleUpdate(o._id, "Cancelled", "Cancelled directly by administrator.")}
                        className="h-9 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-[10px] font-bold text-red-700 transition cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}

                    {isReturnRequested && (
                      <>
                        <button
                          onClick={() => handleUpdate(o._id, "Return Approved", "Return request approved by administrator.")}
                          className="h-9 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[10px] font-bold text-emerald-700 transition cursor-pointer"
                        >
                          Approve Return
                        </button>
                        <button
                          onClick={() => handleUpdate(o._id, "Delivered", "Return request rejected by administrator.")}
                          className="h-9 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-[10px] font-bold text-red-700 transition cursor-pointer"
                        >
                          Reject Return
                        </button>
                      </>
                    )}

                    {isReturnApproved && (
                      <button
                        onClick={() => handleUpdate(o._id, "Returned", "Items received by warehouse.")}
                        className="h-9 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[10px] font-bold text-purple-700 transition cursor-pointer"
                      >
                        Mark Item Received
                      </button>
                    )}

                    {isRefundable && (
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setRefundAmount(o.totalPrice);
                          setRefundMethod(o.paymentMethod === "razorpay" ? "Razorpay" : "UPI");
                          setShowRefundModal(true);
                        }}
                        className="h-9 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-[10px] font-bold text-teal-700 transition cursor-pointer"
                      >
                        Process Refund
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Timeline details display */}
                {isExpanded && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-150 animate-tab-fade text-left space-y-4">
                    <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Order Status Timeline Logs</h4>
                    
                    <div className="relative border-l border-gray-200 ml-3 space-y-4">
                      {o.statusHistory && o.statusHistory.length > 0 ? (
                        o.statusHistory.map((h, i) => (
                          <div key={h._id || i} className="ml-6 relative">
                            <span className="absolute -left-9 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-[9px] font-bold text-indigo-700">
                              {i + 1}
                            </span>
                            <div className="flex flex-col text-xs font-semibold text-gray-700">
                              <h5 className="font-bold text-gray-900 capitalize">{h.status}</h5>
                              <time className="text-[9px] text-gray-400 mt-0.5">{new Date(h.at).toLocaleString()}</time>
                              {h.note && <p className="text-[10px] text-gray-400 font-medium mt-1">{h.note}</p>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-400 font-medium ml-4">No tracking history logs recorded.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Admin Process Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-dropdown">
          <form onSubmit={handleRefundSubmit} className="w-full max-w-md rounded-2xl border border-gray-150 bg-white p-6 shadow-2xl space-y-4 text-left animate-dropdown">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900">Process Order Refund</h3>
              <p className="text-[10px] text-gray-400 font-medium">Verify refund parameters to execute payment updates.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Refund Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                  className="w-full h-11 rounded-xl border border-gray-300 px-4 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Refund Method</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full h-11 rounded-xl border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-150 cursor-pointer"
                >
                  {selectedOrder.paymentMethod === "razorpay" ? (
                    <option value="Razorpay">Razorpay Gateway Refund</option>
                  ) : (
                    <>
                      <option value="UPI">UPI Transfer</option>
                      <option value="Bank Transfer">Bank Account Transfer</option>
                    </>
                  )}
                </select>
              </div>

              {selectedOrder.paymentMethod !== "razorpay" && refundMethod === "UPI" && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="john@upi"
                    required
                    className="w-full h-11 rounded-xl border border-gray-300 px-4 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              )}

              {selectedOrder.paymentMethod !== "razorpay" && refundMethod === "Bank Transfer" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Bank Account Number</label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="1234567890"
                      required
                      className="w-full h-11 rounded-xl border border-gray-300 px-4 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      placeholder="ABCD0123456"
                      required
                      className="w-full h-11 rounded-xl border border-gray-300 px-4 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="btn-secondary"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={processing}
              >
                {processing ? "Processing..." : "Process Refund"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
