import { Link, useParams } from "react-router-dom";

function OrderSuccessPage() {
  const { id } = useParams();

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1 className="mt-5 text-3xl font-bold text-gray-900">Order Placed Successfully</h1>
      <p className="mt-3 text-sm text-gray-600">Thank you for shopping with ShopSphere. Your order has been confirmed.</p>
      <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">Order ID: {id}</p>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/products"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Continue Shopping
        </Link>
        <Link
          to="/orders"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          View Orders
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
