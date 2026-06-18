import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrderById } from "../services/orderService";
import OrderTimeline from "../components/order/OrderTimeline";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function Money({ value }) {
  return <span className="font-semibold">${Number(value || 0).toFixed(2)}</span>;
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchOrderById(id);
        if (mounted) setOrder(data);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || e.message || "Failed to load order.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">Loading order...</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error}</div>;
  if (!order) return null;

  const subtotal = order.itemsPrice || 0;
  const shipping = order.shippingPrice || 0;
  const tax = order.taxPrice || 0;
  const total = order.totalPrice || subtotal + shipping + tax;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Order Details</h1>
        <p className="mt-1 text-sm text-gray-600">Order <span className="font-mono">{order._id}</span> • {formatDate(order.createdAt)}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <section className="md:col-span-2 space-y-4">
          {/* Order Summary */}
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div>
                <p className="text-gray-500">Payment status</p>
                <p className="font-medium capitalize">{order.isPaid ? 'Paid' : 'Unpaid'}</p>
              </div>
              <div>
                <p className="text-gray-500">Order status</p>
                <p className="font-medium capitalize">{order.status || 'pending'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Shipping</p>
                <p className="mt-1 text-sm text-gray-800">
                  {order.shippingAddress?.fullName}
                  <br />{order.shippingAddress?.street}, {order.shippingAddress?.city} {order.shippingAddress?.zipCode}
                </p>
              </div>
            </div>
          </article>

          {/* Product List */}
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Items</h2>
            <ul className="mt-4 divide-y divide-gray-100">
              {order.orderItems.map((it) => (
                <li key={it._id} className="flex items-center gap-4 py-4">
                  <img src={it.image} alt={it.name} className="h-16 w-16 rounded-md object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{it.name}</div>
                    <div className="text-xs text-gray-500">Qty: {it.quantity}</div>
                  </div>
                  <div className="text-sm text-gray-800"><Money value={it.price * it.quantity} /></div>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <aside className="space-y-4">
          {/* Shipping Info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">Shipping Information</h3>
            <p className="mt-3 text-sm text-gray-900">{order.shippingAddress?.fullName}</p>
            <p className="text-sm text-gray-600">{order.shippingAddress?.street}</p>
            <p className="text-sm text-gray-600">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
            <p className="text-sm text-gray-600">{order.shippingAddress?.country}</p>
            <p className="mt-2 text-sm text-gray-600">Phone: {order.shippingAddress?.phone}</p>
          </div>

          {/* Pricing */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">Pricing</h3>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span>Subtotal</span><Money value={subtotal} /></div>
              <div className="flex justify-between"><span>Shipping</span><Money value={shipping} /></div>
              <div className="flex justify-between"><span>Tax</span><Money value={tax} /></div>
              <div className="flex justify-between border-t pt-2"><span className="font-medium">Total</span><Money value={total} /></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">Order Timeline</h3>
            <div className="mt-4">
              {/* Use statusHistory when available, otherwise synthesize fallback */}
              {(() => {
                const hasHistory = Array.isArray(order.statusHistory) && order.statusHistory.length > 0;
                const timeline = hasHistory
                  ? order.statusHistory
                  : (() => {
                      const h = [{ status: "ordered", at: order.createdAt }];
                      if (order.status && order.status !== "ordered") {
                        h.push({ status: order.status, at: order.updatedAt || order.createdAt });
                      }
                      return h;
                    })();

                return <OrderTimeline statusHistory={timeline} currentStatus={order.status} createdAt={order.createdAt} />;
              })()}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/orders')} className="flex-1 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium">Back to Orders</button>
            <button onClick={() => {
              const pid = order.orderItems && order.orderItems[0] && order.orderItems[0].product;
              if (pid) navigate(`/products/${pid}`);
            }} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Buy Again</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
