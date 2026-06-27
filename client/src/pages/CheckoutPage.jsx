import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import { createOrder, calculateOrderPrices } from "../services/orderService";
import * as addressService from "../services/addressService";
import { createRazorpayOrder, verifyRazorpayPayment } from "../services/paymentService";

function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    landmark: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [prices, setPrices] = useState({ itemsPrice: 0, taxPrice: 0, shippingPrice: 0, totalPrice: 0, discountApplied: 0 });
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  useEffect(() => {
    if (cartItems.length === 0) {
      setPrices({ itemsPrice: 0, taxPrice: 0, shippingPrice: 0, totalPrice: 0, discountApplied: 0 });
      setLoadingPrices(false);
      return;
    }

    let mounted = true;
    const fetchPrices = async () => {
      setLoadingPrices(true);
      setError("");
      setCouponError("");
      try {
        const payload = {
          orderItems: cartItems.map((item) => ({
            product: item.productId,
            quantity: Number(item.quantity)
          })),
          couponCode: appliedCoupon || undefined
        };
        const data = await calculateOrderPrices(payload);
        if (mounted) {
          setPrices(data);
          if (appliedCoupon) {
            setCouponSuccess(`Coupon "${appliedCoupon}" applied! Saved $${data.discountApplied.toFixed(2)}`);
          }
        }
      } catch (err) {
        if (mounted) {
          const errMsg = err?.response?.data?.message || err.message || "Failed to calculate order prices";
          if (appliedCoupon) {
            setCouponError(errMsg);
            setAppliedCoupon("");
            setCouponSuccess("");
          } else {
            setError(errMsg);
          }
        }
      } finally {
        if (mounted) {
          setLoadingPrices(false);
        }
      }
    };

    fetchPrices();
    return () => {
      mounted = false;
    };
  }, [cartItems, appliedCoupon]);

  const isFormValid = useMemo(
    () =>
      shippingAddress.fullName.trim() &&
      shippingAddress.address.trim() &&
      shippingAddress.city.trim() &&
      shippingAddress.state.trim() &&
      shippingAddress.postalCode.trim() &&
      shippingAddress.country.trim() &&
      cartItems.length > 0,
    [shippingAddress, cartItems.length]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setError("");

    if (!isFormValid) {
      setError("Please complete all shipping fields and keep at least one cart item.");
      return;
    }

    try {
      setPlacingOrder(true);
      const payload = {
        orderItems: cartItems.map((item) => ({
          product: item.productId,
          quantity: Number(item.quantity),
          name: item.name,
          image: item.image,
          price: Number(item.price || 0),
        })),
        shippingAddress: {
          fullName: shippingAddress.fullName.trim(),
          phone: shippingAddress.phone || '',
          landmark: shippingAddress.landmark || '',
          street: shippingAddress.address.trim(),
          city: shippingAddress.city.trim(),
          state: shippingAddress.state.trim(),
          zipCode: shippingAddress.postalCode.trim(),
          country: shippingAddress.country.trim()
        },
        paymentMethod,
        itemsPrice: Number(prices.itemsPrice.toFixed(2)),
        totalPrice: Number(prices.totalPrice.toFixed(2)),
        couponCode: appliedCoupon || undefined,
      };

      // Create ShopSphere order first (unpaid for Razorpay)
      const createdOrder = await createOrder(payload);

      if (paymentMethod === 'razorpay') {
        // Create razorpay order on server
        const rp = await createRazorpayOrder({ amount: createdOrder.totalPrice, orderId: createdOrder._id });
        // Load Razorpay script
        const loadScript = (src) => new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s);
        });
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');

        const options = {
          key: rp.keyId,
          amount: rp.amount,
          currency: rp.currency,
          name: 'ShopSphere',
          description: `Order ${createdOrder._id}`,
          order_id: rp.orderId,
          handler: async function (response) {
            try {
              // Verify payment on server
              await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: createdOrder._id,
              });

              clearCart();
              navigate(`/order-success/${createdOrder?._id || createdOrder?.id}`, { replace: true });
            } catch (verErr) {
              setError(verErr?.response?.data?.message || verErr?.message || 'Payment verification failed');
              setPlacingOrder(false);
            }
          },
          modal: {
            ondismiss: function () {
              setError("Payment cancelled. You can retry paying when ready.");
              setPlacingOrder(false);
            }
          },
          prefill: {
            name: shippingAddress.fullName,
            contact: shippingAddress.phone,
          },
          theme: { color: '#3367D6' },
        };

        // eslint-disable-next-line no-undef
        const rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', function (resp) {
          setError(resp.error.description || "Payment failed. Please try again.");
          setPlacingOrder(false);
        });

        rzp.open();
      } else {
        // Cash on Delivery or other methods: order already created
        clearCart();
        navigate(`/order-success/${createdOrder?._id || createdOrder?.id}`, { replace: true });
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Failed to place order.");
      setPlacingOrder(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadDefault = async () => {
      try {
        const addrs = await addressService.getAddresses();
        if (!mounted) return;
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        if (def) {
          setShippingAddress((prev) => ({
            ...prev,
            fullName: def.fullName || prev.fullName,
            address: def.street || prev.address,
            city: def.city || prev.city,
            state: def.state || prev.state,
            postalCode: def.zipCode || prev.postalCode,
            country: def.country || prev.country,
            phone: def.phone || prev.phone,
            landmark: def.landmark || prev.landmark,
          }));
          setUsingDefault(true);
        }
      } catch (err) {
        // ignore if user has no addresses or not authenticated yet
      }
    };

    loadDefault();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <p className="mt-2 text-sm text-gray-600">Enter shipping details and confirm your order.</p>
      </header>

      <form onSubmit={handlePlaceOrder} className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={shippingAddress.fullName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={shippingAddress.address}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="landmark" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Landmark (optional)
                </label>
                <input
                  id="landmark"
                  name="landmark"
                  type="text"
                  value={shippingAddress.landmark || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={shippingAddress.phone || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={shippingAddress.city}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label htmlFor="state" className="mb-1.5 block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={shippingAddress.state}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={shippingAddress.country}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                Cash on Delivery
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                Card (placeholder)
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                Razorpay
              </label>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
          <div className="mt-4 max-h-72 space-y-3 overflow-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-800">${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Coupon Code Section */}
          <div className="mt-5 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Have a Coupon?</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                disabled={!!appliedCoupon || loadingPrices}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none uppercase transition focus:border-indigo-500"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon("");
                    setCouponCode("");
                    setCouponSuccess("");
                    setCouponError("");
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (couponCode.trim()) {
                      setAppliedCoupon(couponCode.toUpperCase().trim());
                    }
                  }}
                  disabled={!couponCode.trim() || loadingPrices}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  Apply
                </button>
              )}
            </div>
            {couponSuccess && (
              <p className="mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                {couponSuccess}
              </p>
            )}
            {couponError && (
              <p className="mt-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                {couponError}
              </p>
            )}
          </div>

          <div className="mt-5 border-t border-gray-200 pt-4 text-sm space-y-2">
            <div className="flex items-center justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${prices.itemsPrice.toFixed(2)}</span>
            </div>
            {prices.discountApplied > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span>Discount ({prices.couponCode})</span>
                <span>-${prices.discountApplied.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-gray-600">
              <span>Shipping</span>
              <span>{prices.shippingPrice > 0 ? `$${prices.shippingPrice.toFixed(2)}` : "Free"}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Tax (18%)</span>
              <span>${prices.taxPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-2 font-semibold">
              <span className="text-gray-900">Grand Total</span>
              <span className="text-lg text-indigo-600">${prices.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={placingOrder || loadingPrices || cartItems.length === 0}
            className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placingOrder ? "Placing Order..." : "Place Order"}
          </button>
        </aside>
      </form>
    </div>
  );
}

export default CheckoutPage;
