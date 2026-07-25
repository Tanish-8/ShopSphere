import { useState } from "react";

const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found lower price",
  "Delivery taking too long",
  "Need different product",
  "Other",
];

export default function CancelOrderModal({ isOpen, onClose, onConfirm }) {
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCancelling(true);
    setCancelError("");
    const finalReason = cancelReason === "Other" ? customReason.trim() : cancelReason;
    if (!finalReason) {
      setCancelError("Please describe your reason.");
      setCancelling(false);
      return;
    }
    try {
      await onConfirm(finalReason);
      setCancelReason(CANCEL_REASONS[0]);
      setCustomReason("");
      onClose();
    } catch (err) {
      setCancelError(err?.response?.data?.message || err.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
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

        <div className="px-6 py-5 space-y-4 text-left">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">
              Why are you cancelling?
            </label>
            <div className="space-y-2">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition ${
                    cancelReason === r
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={() => setCancelReason(r)}
                    className="accent-red-600 flex-shrink-0"
                  />
                  <span className="text-xs font-semibold text-gray-700">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {cancelReason === "Other" && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                Please describe
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Tell us more…"
                required
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition resize-none"
              />
            </div>
          )}

          {cancelError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
              {cancelError}
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={cancelling}
            className="btn-secondary"
          >
            Keep Order
          </button>
          <button
            type="submit"
            disabled={cancelling}
            className="h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {cancelling ? "Processing…" : "Confirm Cancellation"}
          </button>
        </div>
      </form>
    </div>
  );
}
