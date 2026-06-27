import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchOrderById } from "../services/orderService";

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchOrderById(id);
        if (mounted) setOrder(data);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err.message || "Failed to load order.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm font-semibold text-gray-500">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading tracking details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700 shadow-xs">
        {error || "Order details not found."}
      </div>
    );
  }

  const getFriendlyInvoiceNumber = () => {
    return `INV-${order._id.slice(-6).toUpperCase()}`;
  };

  const getEstimatedDeliveryDate = () => {
    const created = order.createdAt ? new Date(order.createdAt) : new Date();
    const days = (order.shippingPrice || 0) > 10 ? 2 : 5;
    created.setDate(created.getDate() + days);
    return created;
  };

  const estDelivery = getEstimatedDeliveryDate();
  const currentStatus = order.status || "ordered";

  const stages = [
    { key: "ordered", label: "Order Placed" },
    { key: "confirmed", label: "Payment Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "packed", label: "Packed" },
    { key: "shipped", label: "Shipped" },
    { key: "out_for_delivery", label: "Out For Delivery" },
    { key: "delivered", label: "Delivered" }
  ];

  const isCancelled = currentStatus === "cancelled";
  const activeStages = isCancelled
    ? [
        { key: "ordered", label: "Order Placed" },
        { key: "cancelled", label: "Cancelled" }
      ]
    : stages;

  const history = order.statusHistory || [];

  const getStageInfo = (key) => {
    if (key === "confirmed" && (order.isPaid || order.paymentStatus === "paid")) {
      const paidLog = history.find(h => h.status === "confirmed") || { at: order.paidAt || order.updatedAt };
      return { completed: true, at: paidLog.at };
    }
    const log = history.find(h => h.status === key);
    if (log) {
      return { completed: true, at: log.at };
    }
    if ((key === "ordered" || key === "placed") && history.some(h => h.status === "ordered" || h.status === "placed")) {
      const firstLog = history.find(h => h.status === "ordered" || h.status === "placed") || { at: order.createdAt };
      return { completed: true, at: firstLog.at };
    }
    if (currentStatus === key) {
      return { completed: true, at: order.updatedAt || order.createdAt };
    }
    return { completed: false };
  };

  const formatStageTime = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link to="/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition">
          &larr; Back to Orders
        </Link>
      </div>

      {/* Shipping Progress Card */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-gray-150 p-6 rounded-3xl shadow-xs">
        <div className="space-y-1 text-left">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Status</span>
          <span className="block text-sm font-extrabold text-indigo-600 capitalize">
            {currentStatus.replace(/_/g, " ")}
          </span>
        </div>
        <div className="space-y-1 text-left">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Estimated Delivery</span>
          <span className="block text-sm font-extrabold text-gray-800">
            {isCancelled ? "N/A" : estDelivery.toLocaleDateString(undefined, { dateStyle: "medium" })}
          </span>
        </div>
        <div className="space-y-1 text-left">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Courier Partner</span>
          <span className="block text-sm font-bold text-gray-600">SS Logistical Cargo</span>
        </div>
        <div className="space-y-1 text-left">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Tracking Number</span>
          <span className="block text-sm font-semibold text-gray-500 font-mono select-all">
            {isCancelled ? "N/A" : `TRK${order._id.slice(-8).toUpperCase()}`}
          </span>
        </div>
      </div>

      {/* Main Tracking Details */}
      <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-50 pb-4">
          <div className="text-left">
            <h2 className="text-lg font-bold text-gray-900">Order tracking logs</h2>
            <p className="text-[10px] text-gray-400">Order ID: {order._id || order.id}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="block text-xs font-bold text-gray-800">{getFriendlyInvoiceNumber()}</span>
            <span className="block text-[10px] text-gray-400 mt-0.5">
              Order Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
            </span>
          </div>
        </div>

        {/* Visual Timeline Section */}
        <div>
          {/* Desktop Horizontal View */}
          <div className="hidden md:flex items-start justify-between relative pt-4 pb-8">
            <div className="absolute top-[28px] left-[40px] right-[40px] h-0.5 bg-gray-200 z-0" />
            
            {activeStages.map((stg, i) => {
              const info = getStageInfo(stg.key);
              const isActive = currentStatus === stg.key;
              const completed = info.completed;

              return (
                <div key={stg.key} className="flex-1 flex flex-col items-center text-center relative z-10">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${completed ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" : "bg-white border-gray-300 text-gray-400"} ${isActive ? "ring-4 ring-indigo-100 scale-105 animate-pulse" : ""}`}
                  >
                    {completed ? "✓" : i + 1}
                  </div>
                  <span className={`mt-3 block text-[10px] font-bold ${completed ? "text-gray-900" : "text-gray-400"}`}>
                    {stg.label}
                  </span>
                  {completed && info.at && (
                    <span className="block text-[8px] text-gray-400 mt-1 leading-normal max-w-[100px]">
                      {formatStageTime(info.at)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Vertical View */}
          <div className="md:hidden relative pl-8 space-y-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

            {activeStages.map((stg, i) => {
              const info = getStageInfo(stg.key);
              const isActive = currentStatus === stg.key;
              const completed = info.completed;

              return (
                <div key={stg.key} className="relative flex gap-4 items-start">
                  <div
                    className={`absolute -left-[28px] flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300 z-10 ${completed ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-300 text-gray-400"} ${isActive ? "ring-4 ring-indigo-100 animate-pulse" : ""}`}
                  >
                    {completed ? "✓" : i + 1}
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className={`block text-xs font-bold ${completed ? "text-gray-900" : "text-gray-400"}`}>
                      {stg.label}
                    </span>
                    {completed && info.at && (
                      <span className="block text-[10px] text-gray-400">
                        {formatStageTime(info.at)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative Grid Summary */}
        <div className="grid gap-6 sm:grid-cols-2 pt-6 border-t border-gray-50 text-xs text-gray-600 text-left">
          <div className="space-y-2">
            <h3 className="font-extrabold uppercase tracking-wide text-[10px] text-gray-400">Billing details</h3>
            <p><strong>Payment Method:</strong> <span className="capitalize">{order.paymentMethod}</span></p>
            <p>
              <strong>Payment Status:</strong>{" "}
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${order.isPaid || order.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {order.isPaid || order.paymentStatus === "paid" ? "Paid" : "Pending"}
              </span>
            </p>
            <p><strong>Invoice Number:</strong> {getFriendlyInvoiceNumber()}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold uppercase tracking-wide text-[10px] text-gray-400">Delivery Address</h3>
            <p className="font-bold text-gray-800">{order.shippingAddress?.fullName || order.user?.name}</p>
            <p className="leading-relaxed">
              {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}, {order.shippingAddress?.country}
            </p>
            {order.shippingAddress?.phone && <p>📞 {order.shippingAddress.phone}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
