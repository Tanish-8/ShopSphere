import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrderById, downloadInvoice, cancelOrder, requestOrderReturn } from "../services/orderService";
import { createRazorpayOrder, verifyRazorpayPayment } from "../services/paymentService";
import OrderTimeline from "../components/order/OrderTimeline";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function Money({ value }) {
  return <span className="font-semibold text-gray-950">${Number(value || 0).toFixed(2)}</span>;
}

function statusBadgeClass(status) {
  switch ((status || "").toLowerCase()) {
    case "delivered":       return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "cancelled":       return "bg-red-50 text-red-700 border-red-200";
    case "shipped":
    case "out for delivery": return "bg-blue-50 text-blue-700 border-blue-200";
    case "return requested":
    case "return approved":
    case "pickup scheduled":
    case "picked up":
    case "returned":        return "bg-purple-50 text-purple-700 border-purple-200";
    case "refund processing":
    case "refunded":        return "bg-teal-50 text-teal-700 border-teal-200";
    case "replacement requested":
    case "replacement approved":
    case "replacement shipped":
    case "replacement delivered": return "bg-pink-50 text-pink-700 border-pink-200";
    default:                return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
}

const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found lower price",
  "Delivery taking too long",
  "Need different product",
  "Other",
];

const RETURN_REASONS = [
  "Damaged",
  "Wrong Item",
  "Missing Parts",
  "Defective",
  "Poor Quality",
  "Changed Mind",
  "Other"
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Cancel details panel toggle
  const [showCancelDetails, setShowCancelDetails] = useState(false);

  // Return & Replacement wizard states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnRequestType, setReturnRequestType] = useState("return"); // return or replacement
  const [selectedItems, setSelectedItems] = useState({}); // { item_id: boolean }
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnComments, setReturnComments] = useState("");
  const [evidenceImages, setEvidenceImages] = useState([""]); // Start with one empty string input
  const [evidenceVideo, setEvidenceVideo] = useState("");
  const [returning, setReturning] = useState(false);
  const [returnError, setReturnError] = useState("");

  // ─── Data loading ──────────────────────────────────────────────────────────
  const loadOrder = async () => {
    try {
      const data = await fetchOrderById(id);
      setOrder(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load order.");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchOrderById(id);
        if (mounted) setOrder(data);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || e.message || "Failed to load order.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleDownloadInvoice = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      const data = await downloadInvoice(order._id);
      const blob = new Blob([data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${order._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Failed to generate or download invoice PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setCancelling(true);
    setCancelError("");
    const finalReason = cancelReason === "Other" ? customReason.trim() : cancelReason;
    if (!finalReason) { setCancelError("Please describe your reason."); setCancelling(false); return; }
    try {
      await cancelOrder(order._id, finalReason);
      await loadOrder();
      setShowCancelModal(false);
      setCancelReason(CANCEL_REASONS[0]);
      setCustomReason("");
    } catch (err) {
      setCancelError(err?.response?.data?.message || err.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const handleAddImageInput = () => {
    if (evidenceImages.length < 5) {
      setEvidenceImages([...evidenceImages, ""]);
    }
  };

  const handleImageChange = (index, value) => {
    const updated = [...evidenceImages];
    updated[index] = value;
    setEvidenceImages(updated);
  };

  const handleRemoveImageInput = (index) => {
    const updated = evidenceImages.filter((_, i) => i !== index);
    setEvidenceImages(updated.length > 0 ? updated : [""]);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setReturning(true);
    setReturnError("");

    const itemsToReturn = Object.keys(selectedItems).filter(k => selectedItems[k]);
    if (itemsToReturn.length === 0) {
      setReturnError("Please select at least one item to return/replace.");
      setReturning(false);
      return;
    }

    // Filter out empty image inputs
    const validImages = evidenceImages.filter(img => img.trim());

    try {
      await requestOrderReturn(order._id, {
        type: returnRequestType,
        reason: returnReason,
        comments: returnComments,
        images: validImages,
        video: evidenceVideo || undefined,
        items: itemsToReturn // Pass items array to backend
      });
      await loadOrder();
      setShowReturnModal(false);
      // Reset inputs
      setReturnComments("");
      setEvidenceImages([""]);
      setEvidenceVideo("");
      setSelectedItems({});
    } catch (err) {
      setReturnError(err?.response?.data?.message || err.message || "Failed to submit return request.");
    } finally {
      setReturning(false);
    }
  };

  // ─── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-semibold text-gray-500">Loading order details…</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-xs font-semibold text-red-700">{error}</div>
  );
  if (!order) return null;

  // ─── Derived state ─────────────────────────────────────────────────────────
  const status = order.status || "Placed";
  const statusLower = status.toLowerCase();

  const subtotal = order.itemsPrice || 0;
  const shipping = order.shippingPrice || 0;
  const tax = order.taxPrice || 0;
  const total = order.totalPrice || (subtotal + shipping + tax);

  const CANCELABLE_STATUSES = ["placed", "confirmed", "packed"];
  const NON_CANCELABLE_SHIPPED_MSG = ["shipped", "out for delivery", "delivered",
    "return requested", "return approved", "pickup scheduled", "picked up",
    "returned", "refund processing", "refunded",
    "replacement requested", "replacement approved", "replacement shipped", "replacement delivered"];

  const isCancelable = CANCELABLE_STATUSES.includes(statusLower);
  const isShippedNonCancelable = NON_CANCELABLE_SHIPPED_MSG.includes(statusLower);
  const isCancelled = statusLower === "cancelled";

  const isReturnable = (() => {
    if (statusLower !== "delivered") return false;
    const d = new Date(order.deliveredAt || order.updatedAt);
    return Math.ceil(Math.abs(new Date() - d) / 86400000) <= 7;
  })();

  const isRefundTrackable = ["returned", "refund processing", "refunded"].includes(statusLower) && order.refundResult;

  // Dynamic tracking step lists
  let trackingSteps = ["Placed", "Confirmed", "Packed", "Shipped", "Out For Delivery", "Delivered"];
  const isReplacementFlow = statusLower.startsWith("replacement");
  const isReturnFlow = statusLower.startsWith("return") || statusLower.startsWith("refund") || statusLower === "pickup scheduled" || statusLower === "picked up";

  if (isReplacementFlow) {
    trackingSteps = ["Replacement Requested", "Replacement Approved", "Replacement Shipped", "Replacement Delivered"];
  } else if (isReturnFlow) {
    trackingSteps = ["Return Requested", "Return Approved", "Pickup Scheduled", "Picked Up", "Returned", "Refund Processing", "Refunded"];
  }

  const currentStepIndex = trackingSteps.findIndex(s => s.toLowerCase() === statusLower);

  const cancellationTimelineEntry = order.orderTimeline?.find(h => h.status === "Cancelled")
    || order.statusHistory?.find(h => h.status === "Cancelled");

  return (
    <div className="mx-auto max-w-5xl text-left space-y-5 pb-16">
      {/* Back */}
      <button
        onClick={() => navigate("/orders")}
        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1.5"
      >
        ← Back to My Orders
      </button>

      {/* ── Header Hero Card ─────────────────────────────────────────────── */}
      <header className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Order Details</h1>
              <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-bold border ${statusBadgeClass(status)}`}>
                {status}
              </span>
              {isCancelled && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">
                  🚫 Order Cancelled
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-500">
              Placed on {formatDate(order.createdAt)} &bull; ID:{" "}
              <span className="font-mono text-gray-900 font-bold select-all bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{order._id}</span>
            </p>
          </div>

          <button
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="h-10 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition flex items-center gap-2 cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <span>📥</span> {downloading ? "Saving…" : "Download Invoice"}
          </button>
        </div>
        {downloadError && <p className="text-[10px] text-red-600 font-semibold mt-2">{downloadError}</p>}
      </header>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Left Column (wide) ─────────────────────────────────────────── */}
        <section className="lg:col-span-2 space-y-4">

          {/* Progress Bar — dynamic track paths */}
          {currentStepIndex !== -1 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-5">
                {isReplacementFlow ? "Replacement Tracking" : isReturnFlow ? "Return Tracking" : "Package Progress"}
              </h3>
              <div className="relative flex justify-between items-center">
                <div className="absolute left-0 right-0 top-3 h-1 bg-gray-100 rounded -z-10"></div>
                <div
                  className="absolute left-0 top-3 h-1 bg-emerald-500 rounded -z-10 transition-all duration-700"
                  style={{ width: `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%` }}
                ></div>

                {trackingSteps.map((step, idx) => {
                  const done = idx <= currentStepIndex;
                  const active = idx === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold ring-4 ring-white border transition-all ${
                        done ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-300 text-gray-400"
                      } ${active ? "ring-emerald-100 scale-110" : ""}`}>
                        {done ? "✓" : ""}
                      </div>
                      <span className={`text-[9px] font-bold whitespace-nowrap hidden md:block ${
                        active ? "text-indigo-650 font-extrabold" : done ? "text-gray-700" : "text-gray-400"
                      }`}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancelled Banner */}
          {isCancelled && (
            <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-lg flex-shrink-0">🚫</div>
                <div>
                  <h3 className="text-sm font-extrabold text-red-800">Order Cancelled</h3>
                  {order.cancelledAt && (
                    <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                      on {formatDateTime(order.cancelledAt)}
                      {order.cancelledByRole && ` · by ${order.cancelledByRole}`}
                    </p>
                  )}
                </div>
              </div>

              {order.cancellationReason && (
                <div className="bg-white/70 rounded-xl border border-red-100 px-4 py-2.5 text-xs text-gray-700 font-semibold">
                  <span className="text-gray-400">Reason: </span>{order.cancellationReason}
                </div>
              )}

              {order.isPaid && order.paymentMethod !== "cod" && (
                <div className="bg-white/70 rounded-xl border border-amber-100 px-4 py-2.5 text-xs text-amber-700 font-semibold flex items-center gap-2">
                  <span>💳</span>
                  {order.paymentStatus === "refunded"
                    ? "Your refund has been processed successfully."
                    : "A refund request has been created and is being processed."}
                </div>
              )}
              {order.paymentMethod === "cod" && (
                <div className="bg-white/70 rounded-xl border border-gray-100 px-4 py-2.5 text-xs text-gray-500 font-semibold flex items-center gap-2">
                  <span>🏷️</span> COD order — no refund applicable.
                </div>
              )}
            </div>
          )}

          {/* Shipped — cannot cancel notice */}
          {isShippedNonCancelable && !isCancelled && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 flex items-start gap-3">
              <span className="text-lg flex-shrink-0 mt-0.5">📦</span>
              <p className="text-xs font-semibold text-blue-800">
                This order can no longer be cancelled because it has already been <strong>{status.toLowerCase()}</strong>.
              </p>
            </div>
          )}

          {/* Return & Replacement Details Banner */}
          {order.returnReplacementDetails && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/20 p-5 space-y-3">
              <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-2">
                <span>🔄</span> Return / Replacement Request
              </h3>
              <div className="text-xs font-semibold text-gray-700 space-y-1.5">
                <p><span className="text-gray-400">Request Type:</span> <span className="capitalize font-bold text-purple-700">{order.returnReplacementDetails.type}</span></p>
                <p><span className="text-gray-400">Reason:</span> {order.returnReplacementDetails.reason}</p>
                {order.returnReplacementDetails.comments && (
                  <p><span className="text-gray-400">Comments:</span> {order.returnReplacementDetails.comments}</p>
                )}
                {order.returnReplacementDetails.images && order.returnReplacementDetails.images.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-gray-400">Attached Images:</span>
                    <div className="flex gap-2 flex-wrap">
                      {order.returnReplacementDetails.images.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={url} alt={`Evidence ${i + 1}`} className="h-14 w-14 rounded-lg object-cover border border-gray-200 hover:border-purple-300 transition" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {order.returnReplacementDetails.video && (
                  <p className="pt-1">
                    <span className="text-gray-400">Attached Video:</span>{" "}
                    <a href={order.returnReplacementDetails.video} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      View Clip
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Order Timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order Timeline</h3>
            {(() => {
              const hasTimeline = Array.isArray(order.orderTimeline) && order.orderTimeline.length > 0;
              const hasHistory  = Array.isArray(order.statusHistory) && order.statusHistory.length > 0;
              const fallback    = [{ status: "Placed", at: order.createdAt, note: "Order placed successfully" }];
              return (
                <OrderTimeline
                  statusHistory={hasHistory ? order.statusHistory : fallback}
                  orderTimeline={hasTimeline ? order.orderTimeline : undefined}
                  currentStatus={status}
                />
              );
            })()}
          </div>

          {/* Refund Tracking Card */}
          {order.refundResult && (
            <div id="refund-details-card" className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                🔄 Refund Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 text-xs font-semibold text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-150">
                <div>
                  <p className="text-gray-400 text-[10px]">Refund ID</p>
                  <p className="font-bold text-gray-900 select-all font-mono mt-0.5 text-[10px]">{order.refundResult.refundId}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">Amount</p>
                  <p className="font-bold text-emerald-700 mt-0.5">${Number(order.refundResult.amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">Method</p>
                  <p className="font-bold text-gray-900 capitalize mt-0.5">{order.refundResult.method}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">Status</p>
                  <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                    order.refundResult.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }`}>{order.refundResult.status}</span>
                </div>
                {order.refundResult.date && (
                  <div className="col-span-2 border-t border-gray-100 pt-3">
                    <p className="text-gray-400 text-[10px]">Refund Date</p>
                    <p className="font-bold text-gray-900 mt-0.5 text-[10px]">{formatDateTime(order.refundResult.date)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-3">
              Items in This Order
            </h2>
            <div className="divide-y divide-gray-100">
              {order.orderItems.map((it) => (
                <div key={it._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <img src={it.image} alt={it.name} className="h-18 w-18 rounded-xl object-cover border border-gray-100 flex-shrink-0 h-[72px] w-[72px]" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-gray-900 leading-snug">{it.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-1">
                        Qty: {it.quantity} &bull; Unit: ${Number(it.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 justify-end flex-shrink-0">
                    <button
                      onClick={() => navigate(`/products/${it.product}`)}
                      className="h-9 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-[10px] font-bold text-gray-700 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      🛒 Buy it Again
                    </button>
                    {statusLower === "delivered" && (
                      <button
                        onClick={() => navigate(`/products/${it.product}#reviews`)}
                        className="h-9 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[10px] font-bold text-indigo-700 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        ★ Write a Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Right Column ──────────────────────────────────────────────────── */}
        <aside className="space-y-4">

          {/* Delivery Address + Payment */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-left space-y-4">
            <div>
              <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Delivery Address</h4>
              <p className="text-xs font-extrabold text-gray-900">{order.shippingAddress?.fullName}</p>
              <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
                {order.shippingAddress?.street}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                {order.shippingAddress?.country}
              </p>
              {order.shippingAddress?.phone && (
                <p className="text-[10px] text-gray-400 font-semibold mt-1.5">📞 {order.shippingAddress.phone}</p>
              )}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Payment</h4>
              <p className="text-xs font-extrabold text-gray-900 capitalize">{order.paymentResult?.paymentMethod || order.paymentMethod || "—"}</p>
              <div className="mt-1 space-y-0.5">
                <p className="text-[10px] text-gray-400 font-semibold">
                  Status: <span className="uppercase text-gray-700 font-bold">{order.paymentStatus || (order.isPaid ? "Paid" : "Unpaid")}</span>
                </p>
                {order.paymentResult?.paymentId && (
                  <p className="text-[10px] text-gray-400 font-medium select-all">Txn: {order.paymentResult.paymentId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-left">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Order Summary</h3>
            <div className="space-y-2.5 text-xs font-semibold text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><Money value={subtotal} /></div>
              {order.discountApplied > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>−${Number(order.discountApplied).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between"><span>Shipping</span><Money value={shipping} /></div>
              <div className="flex justify-between"><span>Tax</span><Money value={tax} /></div>
              <div className="flex justify-between border-t border-gray-150 pt-3 text-sm font-extrabold text-gray-900">
                <span>Total</span><Money value={total} />
              </div>
            </div>
          </div>

          {/* Dynamic Actions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2.5">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-semibold">Actions</h3>

            {/* Cancel Order */}
            {isCancelable && (
              <button
                onClick={() => { setCancelError(""); setShowCancelModal(true); }}
                className="w-full h-11 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition text-xs font-bold border border-red-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                🚫 Cancel Order
              </button>
            )}

            {/* Cannot cancel lock msg */}
            {isShippedNonCancelable && !isCancelled && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-[10px] text-gray-500 font-semibold text-center leading-relaxed">
                Cancellation is no longer available — this order has been <strong>{status}</strong>.
              </div>
            )}

            {/* Return Item */}
            {isReturnable && (
              <button
                onClick={() => {
                  setReturnRequestType("return");
                  setReturnError("");
                  setShowReturnModal(true);
                }}
                className="w-full h-11 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition text-xs font-bold border border-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
              >
                🔄 Return Item
              </button>
            )}

            {/* Replace Item (For Eligible Products) */}
            {isReturnable && (
              <button
                onClick={() => {
                  setReturnRequestType("replacement");
                  setReturnError("");
                  setShowReturnModal(true);
                }}
                className="w-full h-11 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 transition text-xs font-bold border border-pink-200 flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
              >
                🔄 Replace Eligible Products
              </button>
            )}

            {/* Track Refund */}
            {isRefundTrackable && (
              <button
                onClick={() => document.getElementById("refund-details-card")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full h-11 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 transition text-xs font-bold border border-teal-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                🔄 Track Refund
              </button>
            )}

            {/* View Cancellation details inline */}
            {isCancelled && cancellationTimelineEntry && (
              <button
                onClick={() => setShowCancelDetails(v => !v)}
                className="w-full h-11 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition text-xs font-bold border border-gray-200 flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
              >
                🗒️ {showCancelDetails ? "Hide Cancellation Info" : "View Cancellation Details"}
              </button>
            )}

            {showCancelDetails && cancellationTimelineEntry && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 space-y-1.5 text-[10px] text-gray-700 font-semibold">
                <p><span className="text-gray-400">Date: </span>{formatDateTime(cancellationTimelineEntry.updatedAt || cancellationTimelineEntry.at)}</p>
                {order.cancelledByRole && <p><span className="text-gray-400">By: </span>{order.cancelledByRole}</p>}
                {order.cancellationReason && <p><span className="text-gray-400">Reason: </span>{order.cancellationReason}</p>}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CANCELLATION MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleCancelSubmit}
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
          >
            <div className="bg-red-50 border-b border-red-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-lg">🚫</div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Cancel Order</h3>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  Why are you cancelling?
                </label>
                <div className="space-y-2">
                  {CANCEL_REASONS.map((r) => (
                    <label key={r} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition ${
                      cancelReason === r ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}>
                      <input
                        type="radio" name="cancelReason" value={r}
                        checked={cancelReason === r} onChange={() => setCancelReason(r)}
                        className="accent-red-600 flex-shrink-0"
                      />
                      <span className="text-xs font-semibold text-gray-700">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {cancelReason === "Other" && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Please describe</label>
                  <textarea
                    value={customReason} onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Tell us more…" required rows={3}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition resize-none"
                  />
                </div>
              )}

              {cancelError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">{cancelError}</div>}
            </div>

            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCancelModal(false)} disabled={cancelling} className="btn-secondary">Keep Order</button>
              <button type="submit" disabled={cancelling} className="h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                {cancelling ? "Processing…" : "Confirm Cancellation"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          RETURN & REPLACEMENT MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleReturnSubmit}
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden my-8"
          >
            <div className="border-b border-gray-100 px-6 py-5 bg-purple-50/50">
              <h3 className="text-sm font-extrabold text-gray-900">
                {returnRequestType === "replacement" ? "Request Product Replacement" : "Return Order Items"}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                {returnRequestType === "replacement"
                  ? "Choose items and specify replacement details."
                  : "Request refund for selected items."}
              </p>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              
              {/* Item selection checklist */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  Select items to {returnRequestType === "replacement" ? "Replace" : "Return"}
                </label>
                <div className="space-y-2">
                  {order.orderItems.map((item) => (
                    <label key={item._id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={!!selectedItems[item._id]}
                        onChange={(e) => setSelectedItems({ ...selectedItems, [item._id]: e.target.checked })}
                        className="accent-indigo-600 h-4 w-4"
                      />
                      <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-gray-150 flex-shrink-0" />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-bold text-gray-900 truncate leading-snug">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Qty: {item.quantity} &bull; Price: ${Number(item.price).toFixed(2)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reasons list dropdown */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Reason for request</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full h-11 rounded-xl border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  {RETURN_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Media inputs (up to 5 images) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                    Evidence Image URLs (Up to 5)
                  </label>
                  {evidenceImages.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddImageInput}
                      className="text-[10px] font-bold text-indigo-650 hover:text-indigo-850"
                    >
                      + Add Image
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {evidenceImages.map((imgUrl, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={imgUrl}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        placeholder={`https://example.com/evidence_image_${index + 1}.jpg`}
                        className="flex-1 h-10 rounded-xl border border-gray-300 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition"
                      />
                      {evidenceImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageInput(index)}
                          className="px-2 text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Video Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  Optional Evidence Video URL
                </label>
                <input
                  type="text"
                  value={evidenceVideo}
                  onChange={(e) => setEvidenceVideo(e.target.value)}
                  placeholder="https://example.com/defect_video.mp4"
                  className="w-full h-11 rounded-xl border border-gray-300 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>

              {/* Comments Textarea */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Detailed Comments</label>
                <textarea
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  placeholder="Tell us more about the defect or issue…"
                  required
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition resize-none"
                />
              </div>

              {returnError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
                  {returnError}
                </div>
              )}
            </div>

            <div className="px-6 pb-5 flex gap-3 justify-end border-t border-gray-50 pt-4 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                disabled={returning}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={returning}
                className="btn-primary"
              >
                {returning ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
