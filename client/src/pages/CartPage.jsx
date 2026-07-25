import { useState, useEffect } from "react";
import { useCurrency } from "../contexts/CurrencyContext";
import { Link, useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";
import { fetchProducts } from "../services/productService";
import { validateCoupon } from "../services/couponService";
import { fetchWishlist, addToWishlist, removeFromWishlist } from "../services/wishlistService";
import ProductCard from "../components/product/ProductCard";
import { useToast } from "../contexts/ToastContext";
import { FALLBACK_PRODUCT_IMAGE } from "../utils/productImage";

function CartPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cartItems, updateQuantity, removeItem, clearCart, totalPrice, totalItemCount } = useCart();
  const { convertPrice, formatCurrency } = useCurrency();

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(() => localStorage.getItem("shopsphere_applied_coupon") || "");
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [validating, setValidating] = useState(false);

  // Recommendations and Wishlist state
  const [recommendations, setRecommendations] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Free shipping config
  const FREE_SHIPPING_THRESHOLD = 500;
  const progressPercentage = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountLeft = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);

  // Delivery estimates (calculated dynamically)
  const getDeliveryDateRange = (daysMin, daysMax) => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + daysMin);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + daysMax);

    const options = { month: "short", day: "numeric" };
    return `${minDate.toLocaleDateString(undefined, options)} - ${maxDate.toLocaleDateString(undefined, options)}`;
  };

  // Validate coupon when cart items change or coupon is applied
  useEffect(() => {
    if (!appliedCoupon || cartItems.length === 0) {
      setDiscount(0);
      setCouponSuccess("");
      return;
    }
    const checkCoupon = async () => {
      try {
        const res = await validateCoupon(appliedCoupon, cartItems.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price
        })));
        if (res.success) {
          setDiscount(res.discountApplied || 0);
          setCouponSuccess(`Coupon "${appliedCoupon}" active. Saved $${res.discountApplied.toFixed(2)}`);
          setCouponError("");
        }
      } catch (err) {
        setCouponError(err?.response?.data?.message || err.message || "Invalid coupon");
        setAppliedCoupon("");
        localStorage.removeItem("shopsphere_applied_coupon");
        setDiscount(0);
      }
    };
    checkCoupon();
  }, [cartItems, appliedCoupon]);

  // Fetch recommendations and wishlist on mount/cart change
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingRecs(true);
        const data = await fetchProducts({ limit: 10 });
        const cartProductIds = cartItems.map((item) => item.productId);
        const filtered = data.filter((prod) => !cartProductIds.includes(prod._id || prod.id));
        if (mounted) {
          setRecommendations(filtered.slice(0, 4));
        }
      } catch (err) {
        console.error("Recommendations fetch error:", err);
      } finally {
        if (mounted) setLoadingRecs(false);
      }
    })();

    if (isAuthenticated) {
      (async () => {
        try {
          const list = await fetchWishlist();
          if (mounted) setWishlistIds(list.map((p) => p._id || p.id));
        } catch (e) {
          // ignore
        }
      })();
    }

    return () => {
      mounted = false;
    };
  }, [cartItems, isAuthenticated]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setValidating(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      const res = await validateCoupon(couponCode.toUpperCase().trim(), cartItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price
      })));
      if (res.success) {
        setAppliedCoupon(couponCode.toUpperCase().trim());
        localStorage.setItem("shopsphere_applied_coupon", couponCode.toUpperCase().trim());
        setDiscount(res.discountApplied || 0);
        setCouponSuccess(`Coupon "${couponCode.toUpperCase().trim()}" applied! Saved $${res.discountApplied.toFixed(2)}`);
        toast.success("Coupon Applied!", `Saved $${res.discountApplied.toFixed(2)} on your order.`);
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || "Failed to validate coupon";
      setCouponError(errMsg);
      toast.error("Coupon Error", errMsg);
      setDiscount(0);
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon("");
    setCouponCode("");
    setDiscount(0);
    setCouponSuccess("");
    setCouponError("");
    localStorage.removeItem("shopsphere_applied_coupon");
    toast.info("Coupon Removed", "Discount code has been detached from your cart.");
  };

  const handleWishlistToggle = async (productId) => {
    if (!isAuthenticated) return navigate("/login");
    const prod = recommendations.find((p) => (p._id || p.id) === productId);
    const prodName = prod ? prod.name : "Product";
    const toastId = toast.loading("Updating Wishlist...");

    try {
      const isWishlisted = wishlistIds.includes(productId);
      if (isWishlisted) {
        await removeFromWishlist(productId);
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
        toast.dismiss(toastId);
        toast.info("Removed from Wishlist", <p className="font-bold text-gray-905">{prodName}</p>);
      } else {
        await addToWishlist(productId);
        setWishlistIds((prev) => [...prev, productId]);
        toast.dismiss(toastId);
        toast.success("Added to Wishlist", (
          <div className="space-y-1">
            <p className="font-extrabold text-gray-900 leading-tight">{prodName}</p>
            <div className="flex gap-2.5 pt-1 text-[10px] font-black text-indigo-650">
              <a href="/wishlist" className="hover:underline">View Wishlist</a>
              <span className="text-gray-300">|</span>
              <a href="/products" className="hover:underline">Continue Shopping</a>
            </div>
          </div>
        ));
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Something went wrong.", "Please try again.");
    }
  };

  return (
    <div className="space-y-10 animate-dropdown text-left">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shopping Cart</h1>
        <p className="mt-2 text-sm text-gray-600">Review your selections and apply any rewards before checkout.</p>
      </header>

      {cartItems.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <div className="text-5xl">🛒</div>
          <h2 className="text-lg font-bold text-gray-805">Your cart is empty</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            Looks like you haven't added anything to your cart yet. Explore our top categories to find amazing deals!
          </p>
          <Link
            to="/products"
            className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-xs font-extrabold text-white transition-all duration-300 hover:bg-indigo-750 active:scale-95 shadow-sm"
          >
            Explore Catalog
          </Link>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left panel: Cart item cards list */}
          <section className="space-y-4 lg:col-span-2">
            {cartItems.map((item) => (
              <article
                key={item.productId}
                className="grid gap-4 rounded-2xl border border-gray-150 bg-white p-4.5 shadow-xs sm:grid-cols-[100px_1fr] transition-all hover:border-gray-250"
              >
                <div className="h-24 w-24 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 aspect-square">
                  <img
                    src={item.image || FALLBACK_PRODUCT_IMAGE}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_PRODUCT_IMAGE;
                    }}
                  />
                </div>

                <div className="flex flex-col justify-between space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="font-bold text-gray-850 hover:text-indigo-650 transition-colors leading-snug max-w-md">
                      {item.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-indigo-600">{formatCurrency(convertPrice(Number(item.price)))}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-50">
                    <div className="inline-flex items-center rounded-xl border border-gray-250 bg-gray-50 overflow-hidden">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-gray-750 font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.countInStock || 999}
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                        className="w-12 border-x border-gray-250 py-1 text-center text-xs outline-none bg-white font-bold text-gray-800"
                      />
                      <button
                        type="button"
                        className="px-3 py-1.5 text-gray-750 font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                        onClick={() =>
                          updateQuantity(item.productId, Math.min(Number(item.countInStock || 999), Number(item.quantity) + 1))
                        }
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm font-black text-gray-900">
                      Subtotal: {formatCurrency(convertPrice(Number(item.price || 0) * Number(item.quantity || 0)))}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={clearCart}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
              >
                Clear Cart
              </button>
              <Link
                to="/products"
                className="text-xs font-extrabold text-indigo-650 hover:underline flex items-center gap-1"
              >
                &larr; Continue Shopping
              </Link>
            </div>
          </section>

          {/* Right panel: Order summary and sidebar tools */}
          <aside className="space-y-6">
            {/* Free Shipping Progress Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5">
                  🚚 {amountLeft > 0 ? "Free Shipping Goal" : "Goal Unlocked!"}
                </span>
                <span>{formatCurrency(convertPrice(totalPrice))} / {formatCurrency(convertPrice(FREE_SHIPPING_THRESHOLD))}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-150 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-gray-500 leading-normal">
                {amountLeft > 0 ? (
                  <>Add <span className="text-indigo-600">{formatCurrency(convertPrice(amountLeft))}</span> more to qualify for FREE shipping!</>
                ) : (
                  <span className="text-emerald-700 font-extrabold">Congratulations! Your order qualifies for free shipping.</span>
                )}
              </p>
            </div>

            {/* Main Order Summary Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-5">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-2">Order Summary</h2>

              <div className="space-y-3 text-xs font-semibold text-gray-650">
                <div className="flex items-center justify-between">
                  <span>Total Items</span>
                  <span className="font-bold text-gray-800">{totalItemCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-gray-800">{formatCurrency(convertPrice(totalPrice))}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-650">
                    <span>Coupon Discount</span>
                    <span>-{formatCurrency(convertPrice(discount))}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-black text-gray-900">
                  <span>Estimated Total</span>
                  <span className="text-base text-indigo-650">{formatCurrency(convertPrice(totalPrice - discount))}</span>
                </div>
              </div>

              {/* Coupon input field */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Apply Promo Code</label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-250 p-2.5 text-xs text-emerald-800 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🎟️</span>
                      <span className="font-extrabold">{appliedCoupon}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[10px] font-extrabold text-emerald-700 hover:text-rose-600 bg-white shadow-xs rounded px-2 py-1 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. WELCOME10"
                      className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-bold uppercase outline-none transition focus:border-indigo-500 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={validating || !couponCode.trim()}
                      className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-650 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {validating ? "Validating..." : "Apply"}
                    </button>
                  </form>
                )}
                {couponError && (
                  <p className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 leading-relaxed">
                    ❌ {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-[10px] font-semibold text-emerald-750 bg-emerald-50 border border-emerald-100 rounded-lg p-2 leading-relaxed">
                    ✨ {couponSuccess}
                  </p>
                )}
              </div>

              <Link
                to="/checkout"
                className="block w-full rounded-xl bg-indigo-650 py-3 text-center text-xs font-extrabold text-white transition-all duration-300 hover:bg-indigo-750 active:scale-95 shadow-sm"
              >
                Proceed to Checkout
              </Link>
            </div>

            {/* Delivery Estimates Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3.5">
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                📅 Delivery Estimates
              </h3>
              <div className="space-y-3 text-xs text-gray-650 font-semibold">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div className="flex flex-col text-left">
                    <span>Standard Shipping</span>
                    <span className="text-[10px] text-gray-400 font-medium">Free on orders above {formatCurrency(convertPrice(500))}</span>
                  </div>
                  <span className="text-right text-gray-905">{getDeliveryDateRange(3, 5)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col text-left">
                    <span>Express Shipping</span>
                    <span className="text-[10px] text-gray-400 font-medium">Next-day local packing</span>
                  </div>
                  <span className="text-right text-gray-905">{getDeliveryDateRange(1, 2)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Recommended Products cross-selling section */}
      {recommendations.length > 0 && (
        <section className="pt-10 border-t border-gray-150">
          <div className="mb-6 text-left">
            <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
            <p className="text-xs text-gray-500 mt-1">Recommended matches based on your cart.</p>
          </div>

          {loadingRecs ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="h-56 rounded-2xl bg-gray-100 animate-pulse"></div>
              <div className="h-56 rounded-2xl bg-gray-100 animate-pulse"></div>
              <div className="h-56 rounded-2xl bg-gray-100 animate-pulse"></div>
              <div className="h-56 rounded-2xl bg-gray-100 animate-pulse"></div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  isWishlisted={wishlistIds.includes(product._id || product.id)}
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default CartPage;

