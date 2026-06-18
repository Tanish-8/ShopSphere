import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import { createOrder } from "../services/orderService";
import * as addressService from "../services/addressService";

function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, totalPrice, clearCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [usingDefault, setUsingDefault] = useState(false);

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
          quantity: Number(item.quantity)
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
        totalPrice: Number(totalPrice.toFixed(2))
      };

      const createdOrder = await createOrder(payload);
      clearCart();
      navigate(`/order-success/${createdOrder?._id || createdOrder?.id}`, { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Failed to place order.");
    } finally {
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

          <div className="mt-5 border-t border-gray-200 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total</span>
              <span className="text-lg font-bold text-indigo-600">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={placingOrder || cartItems.length === 0}
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
