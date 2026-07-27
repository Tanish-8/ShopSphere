import { useState } from "react";
import { useToast } from "../contexts/ToastContext";

const AVAILABLE_COUPONS = [
  {
    code: "WELCOME10",
    discount: "10% OFF",
    type: "percentage",
    value: 10,
    description: "Get 10% off on your first order. Start your premium shopping journey today.",
    minOrder: 999,
    maxDiscount: 500,
    expiryDate: "2026-12-31",
    color: "from-indigo-600 to-violet-600",
    glowColor: "rgba(99, 102, 241, 0.15)"
  },
  {
    code: "SAVE500",
    discount: "₹500 OFF",
    type: "fixed",
    value: 500,
    description: "Enjoy a flat ₹500 discount on your order. Applicable storewide on orders above ₹4,999.",
    minOrder: 4999,
    maxDiscount: 500,
    expiryDate: "2026-11-30",
    color: "from-rose-500 to-pink-600",
    glowColor: "rgba(244, 63, 94, 0.15)"
  },
  {
    code: "FREESHIP",
    discount: "FREE DELIVERY",
    type: "percentage",
    value: 0,
    description: "Unlock free delivery on your cart. Save on shipping costs for any premium items.",
    minOrder: 499,
    maxDiscount: 100,
    expiryDate: "2026-10-31",
    color: "from-emerald-500 to-teal-600",
    glowColor: "rgba(16, 185, 129, 0.15)"
  },
  {
    code: "TECH10",
    discount: "10% OFF",
    type: "percentage",
    value: 10,
    description: "Special 10% discount on all electronics. Upgrade your desktop setup or portable audio.",
    minOrder: 9999,
    maxDiscount: 2000,
    expiryDate: "2026-09-30",
    color: "from-blue-600 to-cyan-600",
    glowColor: "rgba(37, 99, 235, 0.15)"
  }
];

export default function CouponsPage() {
  const toast = useToast();
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Coupon Copied!", (
      <div className="space-y-1">
        <p className="font-extrabold text-gray-900 leading-tight">Code: <span className="text-indigo-600">{code}</span></p>
        <p className="text-[10px] text-gray-500">Apply this code during cart review or checkout.</p>
      </div>
    ));
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const formatRupees = (amount) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-8 animate-dropdown">
      <header className="text-left">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Your Rewards & Coupons</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Save on your purchases with active promo offers. Copy any code and apply it in your cart or checkout.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {AVAILABLE_COUPONS.map((coupon) => (
          <div
            key={coupon.code}
            className="group relative flex h-52 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            style={{ boxShadow: `0 4px 20px -2px ${coupon.glowColor}` }}
          >
            {/* Left section: Gradient badge & Discount */}
            <div className={`w-1/3 bg-gradient-to-br ${coupon.color} p-4 flex flex-col items-center justify-center text-white relative shrink-0 h-full`}>
              <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-10 hidden sm:block"></div>
              <div className="text-center">
                <span className="text-2xl font-black tracking-tight leading-none block">{coupon.discount.split(" ")[0]}</span>
                <span className="block text-[9px] font-black uppercase tracking-widest mt-1.5 opacity-90">
                  {coupon.discount.split(" ").slice(1).join(" ") || "Discount"}
                </span>
              </div>
            </div>

            {/* Right section: Ticket Details */}
            <div className="flex-1 p-5 flex flex-col justify-between text-left relative h-full">
              <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-10 hidden sm:block"></div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="inline-block rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-1 text-xs font-black tracking-wider text-indigo-700 dark:text-indigo-300 uppercase">
                    {coupon.code}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap">
                    Expires {new Date(coupon.expiryDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium mt-1 line-clamp-2 h-9">
                  {coupon.description}
                </p>
              </div>

              <div className="pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4 mt-auto">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1">
                    <span>Min Spend:</span>
                    <span className="font-extrabold text-gray-900 dark:text-gray-100">{formatRupees(coupon.minOrder)}</span>
                  </div>
                  {coupon.maxDiscount > 0 && coupon.maxDiscount !== coupon.value && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                      <span>Max Discount:</span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">{formatRupees(coupon.maxDiscount)}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(coupon.code)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm ${
                    copiedCode === coupon.code
                      ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:text-white"
                  }`}
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Guide on How to Use */}
      <div className="rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-6 text-left space-y-3">
        <h3 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
          <span>💡</span> How to use coupon codes
        </h3>
        <ol className="list-decimal pl-5 text-xs text-indigo-900 dark:text-indigo-300 space-y-2 font-medium">
          <li>Browse the coupons above and click <strong className="font-extrabold text-indigo-950 dark:text-indigo-100">Copy Code</strong> to copy the promo code to your clipboard.</li>
          <li>Add items from our catalog to your cart. Ensure your subtotal meets the minimum spend requirement.</li>
          <li>Go to your cart page or proceed to checkout, enter the code in the <strong className="font-extrabold text-indigo-950 dark:text-indigo-100">Promo Code / Coupon</strong> field, and click <strong className="font-extrabold text-indigo-950 dark:text-indigo-100">Apply</strong>.</li>
          <li>Your discount will be automatically calculated and deducted from the grand total. Enjoy your savings!</li>
        </ol>
      </div>
    </div>
  );
}
