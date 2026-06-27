import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import { createOrder, calculateOrderPrices } from "../services/orderService";
import * as addressService from "../services/addressService";
import { createRazorpayOrder, verifyRazorpayPayment } from "../services/paymentService";

export default function CheckoutPage() {
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

  // Card Payment States
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardBrand, setCardBrand] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Simulated Razorpay Modal States
  const [showRpModal, setShowRpModal] = useState(false);
  const [simulatedRpOrder, setSimulatedRpOrder] = useState(null);
  const [simulatedOrderObj, setSimulatedOrderObj] = useState(null);

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

  // Card Input Formatters
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const matches = raw.match(/.{1,4}/g);
    const formatted = matches ? matches.join(" ") : "";
    setCardNumber(formatted);
    
    // Auto detect card brand
    if (raw.startsWith("4")) {
      setCardBrand("Visa");
    } else if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(raw)) {
      setCardBrand("Mastercard");
    } else if (/^3[47]/.test(raw)) {
      setCardBrand("Amex");
    } else if (/^(60|65|81|82)/.test(raw)) {
      setCardBrand("RuPay");
    } else {
      setCardBrand("");
    }
  };

  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)} / ${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  const handleCvvChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(raw);
  };

  // Luhn Check Algorithm
  const validateLuhn = (num) => {
    const digits = num.replace(/\s+/g, "").split("").map(Number);
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const validateCardForm = () => {
    const errors = {};
    
    if (!cardholderName.trim()) {
      errors.cardholderName = "Cardholder Name is required.";
    } else if (!/^[A-Za-z\s]+$/.test(cardholderName)) {
      errors.cardholderName = "Letters and spaces only.";
    }

    const rawCardNumber = cardNumber.replace(/\s+/g, "");
    if (!rawCardNumber) {
      errors.cardNumber = "Card Number is required.";
    } else if (rawCardNumber.length < 13 || rawCardNumber.length > 16) {
      errors.cardNumber = "Card number must be 13 to 16 digits.";
    } else if (!validateLuhn(rawCardNumber)) {
      errors.cardNumber = "Invalid card number (fails Luhn check).";
    }

    const expiryParts = expiry.split(" / ");
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      errors.expiry = "Expiry must be MM / YY.";
    } else {
      const month = parseInt(expiryParts[0], 10);
      const year = parseInt("20" + expiryParts[1], 10);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      if (month < 1 || month > 12) {
        errors.expiry = "Month must be 01 to 12.";
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.expiry = "Card has expired.";
      }
    }

    if (!cvv) {
      errors.cvv = "CVV is required.";
    } else if (cvv.length < 3 || cvv.length > 4) {
      errors.cvv = "CVV must be 3 or 4 digits.";
    }

    return errors;
  };

  // Simulate success payment callback
  const handleSimulatedPaymentSuccess = async () => {
    try {
      setPlacingOrder(true);
      setError("");
      
      const verifyPayload = {
        razorpay_order_id: simulatedRpOrder.orderId,
        razorpay_payment_id: `pay_sim_${Math.random().toString(36).substring(2, 11)}`,
        razorpay_signature: "simulated_secure_signature",
        orderId: simulatedOrderObj._id
      };

      await verifyRazorpayPayment(verifyPayload);
      clearCart();
      setShowRpModal(false);
      navigate(`/order-success/${simulatedOrderObj?._id || simulatedOrderObj?.id}`, { replace: true });
    } catch (verErr) {
      setError(verErr?.response?.data?.message || verErr?.message || 'Payment verification failed');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setError("");
    setFormErrors({});

    if (!isFormValid) {
      setError("Please complete all shipping fields and keep at least one cart item.");
      return;
    }

    if (paymentMethod === "card") {
      const cardErrors = validateCardForm();
      if (Object.keys(cardErrors).length > 0) {
        setFormErrors(cardErrors);
        setError("Please correct the card validation errors before completing payment.");
        return;
      }
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

      if (paymentMethod === "card") {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Create ShopSphere order
      const createdOrder = await createOrder(payload);

      if (paymentMethod === 'razorpay') {
        const rp = await createRazorpayOrder({ amount: createdOrder.totalPrice, orderId: createdOrder._id });
        
        // Trigger simulation flow if keys are placeholders or Razorpay SDK is not active
        if (rp.simulated || !window.Razorpay) {
          setSimulatedRpOrder(rp);
          setSimulatedOrderObj(createdOrder);
          setShowRpModal(true);
          setPlacingOrder(false);
          return;
        }

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
          theme: { color: '#6366F1' },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setError(resp.error.description || "Payment failed. Please try again.");
          setPlacingOrder(false);
        });

        rzp.open();
      } else {
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
            phone: def.phone || prev.phone
          }));
        }
      } catch {
        // Fallback silently if not loaded
      }
    };

    loadDefault();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl text-left pb-16">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
      <p className="mt-1 text-xs text-gray-500 font-medium">Verify your address items details to place order.</p>

      <form onSubmit={handlePlaceOrder} className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          {/* Card 1: Shipping Address */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-50 pb-2">Shipping Details</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={shippingAddress.fullName}
                  onChange={handleInputChange}
                  className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={shippingAddress.phone}
                  onChange={handleInputChange}
                  className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={shippingAddress.address}
                  onChange={handleInputChange}
                  className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Landmark / Suite (Optional)</label>
                <input
                  type="text"
                  name="landmark"
                  value={shippingAddress.landmark}
                  onChange={handleInputChange}
                  className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">City</label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleInputChange}
                  className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">State</label>
                <input
                  type="text"
                  name="state"
                  value={shippingAddress.state}
                  onChange={handleInputChange}
                  className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={handleInputChange}
                  className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Country</label>
              <input
                type="text"
                name="country"
                value={shippingAddress.country}
                onChange={handleInputChange}
                className="w-full h-11 rounded-xl border border-gray-300 px-4 py-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                required
              />
            </div>
          </div>

          {/* Card 2: Payment Selector and Expansion Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-50 pb-2">Payment Method</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50/50 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span>💵 Cash on Delivery</span>
              </label>

              {/* Credit / Debit Card selection option */}
              <div className={`rounded-xl border transition ${paymentMethod === "card" ? "border-indigo-500 bg-indigo-50/5" : "border-gray-200"}`}>
                <label className="flex items-center gap-3 p-4 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50/50 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span>💳 Credit / Debit Card</span>
                </label>

                {/* Expanded payment card form below selection */}
                {paymentMethod === "card" && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-150 space-y-4 text-left animate-tab-fade">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className={`w-full h-11 rounded-xl border px-4 py-3 text-xs outline-none transition ${formErrors.cardholderName ? "border-red-550" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                      />
                      {formErrors.cardholderName && <p className="text-[10px] text-red-600 font-semibold">{formErrors.cardholderName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4000 1234 5678 9010"
                          className={`w-full h-11 rounded-xl border pl-4 pr-16 py-3 text-xs outline-none transition ${formErrors.cardNumber ? "border-red-550" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                        />
                        {cardBrand && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 uppercase border border-indigo-200">
                            {cardBrand}
                          </span>
                        )}
                      </div>
                      {formErrors.cardNumber && <p className="text-[10px] text-red-600 font-semibold">{formErrors.cardNumber}</p>}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Expiry Date (MM / YY)</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={handleExpiryChange}
                          placeholder="MM / YY"
                          className={`w-full h-11 rounded-xl border px-4 py-3 text-xs outline-none transition ${formErrors.expiry ? "border-red-550" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                        />
                        {formErrors.expiry && <p className="text-[10px] text-red-600 font-semibold">{formErrors.expiry}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">CVV Code</label>
                        <input
                          type="password"
                          value={cvv}
                          onChange={handleCvvChange}
                          placeholder="123"
                          className={`w-full h-11 rounded-xl border px-4 py-3 text-xs outline-none transition ${formErrors.cvv ? "border-red-550" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                        />
                        {formErrors.cvv && <p className="text-[10px] text-red-600 font-semibold">{formErrors.cvv}</p>}
                      </div>
                    </div>

                    {/* SSL lock secure verification stamp */}
                    <div className="flex items-center gap-2 pt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                      <span>🔒</span>
                      <span>Your payment is secured with SSL encryption.</span>
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50/50 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span>⚡ Razorpay Secure</span>
              </label>
            </div>
          </div>
        </section>

        {/* Right Column: Order summary and prices */}
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-2">Order Summary</h2>
          <div className="max-h-72 space-y-3 overflow-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-800">{item.name}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-800">${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Coupon Code Section */}
          <div className="border-t border-gray-150 pt-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-900">Have a Coupon?</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                disabled={!!appliedCoupon || loadingPrices}
                className="flex-1 h-9 rounded-xl border border-gray-300 px-3 text-xs outline-none uppercase transition focus:border-indigo-500"
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
                  className="btn-small border border-red-500 text-red-500 hover:bg-red-50"
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
                  className="btn-small border border-indigo-600 text-indigo-650 hover:bg-indigo-50"
                >
                  Apply
                </button>
              )}
            </div>
            {couponSuccess && (
              <p className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                {couponSuccess}
              </p>
            )}
            {couponError && (
              <p className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">
                {couponError}
              </p>
            )}
          </div>

          {/* Total calculation list */}
          <div className="border-t border-gray-150 pt-4 space-y-2 text-xs font-semibold text-gray-600">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span>${prices.itemsPrice.toFixed(2)}</span>
            </div>
            {prices.discountApplied > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-${prices.discountApplied.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (GST)</span>
              <span>${prices.taxPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span>${prices.shippingPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-150 pt-2.5">
              <span>Grand Total</span>
              <span>${prices.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={placingOrder || loadingPrices}
            className="btn-primary w-full mt-2"
          >
            {placingOrder ? "Securing Payment..." : "Place Order"}
          </button>
        </aside>
      </form>

      {/* Simulated Razorpay Checkout Dialog */}
      {showRpModal && simulatedRpOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-dropdown">
          <div className="w-full max-w-md rounded-2xl border border-gray-150 bg-white p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Razorpay Secure Checkout</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Demo Payment Simulation</p>
                </div>
              </div>
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700 uppercase">
                Test Mode
              </span>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl text-xs text-gray-600 font-semibold border border-gray-150">
              <div className="flex justify-between">
                <span>ShopSphere Order ID:</span>
                <span className="font-bold text-gray-900">{simulatedOrderObj?._id || simulatedOrderObj?.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Razorpay Order ID:</span>
                <span className="font-bold text-gray-900">{simulatedRpOrder.orderId}</span>
              </div>
              <div className="flex justify-between border-t border-gray-150 pt-2 text-sm text-gray-950 font-extrabold">
                <span>Total Amount:</span>
                <span>${(simulatedRpOrder.amount / 100).toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 leading-relaxed">
              This simulated gateway represents Razorpay Checkout for PCI compliance. You can choose to simulate a successful payment processing event or decline it.
            </p>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setError("Payment cancelled. You can retry paying when ready.");
                  setShowRpModal(false);
                }}
                className="btn-secondary"
                disabled={placingOrder}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatedPaymentSuccess}
                className="btn-primary"
                disabled={placingOrder}
              >
                {placingOrder ? "Verifying..." : "Simulate Success Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
