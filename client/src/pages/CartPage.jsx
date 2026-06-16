import { Link } from "react-router-dom";
import useCart from "../hooks/useCart";

function CartPage() {
  const { cartItems, updateQuantity, removeItem, clearCart, totalPrice, totalItemCount } = useCart();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
        <p className="mt-2 text-sm text-gray-600">Review your items before checkout.</p>
      </header>

      {cartItems.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">Your cart is currently empty.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Continue Shopping
          </Link>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-2">
            {cartItems.map((item) => (
              <article
                key={item.productId}
                className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[96px_1fr]"
              >
                <img src={item.image} alt={item.name} className="h-24 w-24 rounded-lg object-cover" />

                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-semibold text-gray-900">{item.name}</h2>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>

                  <p className="text-sm font-medium text-indigo-600">${Number(item.price).toFixed(2)}</p>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-lg border border-gray-300">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-gray-700 hover:bg-gray-100"
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.countInStock}
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.productId, event.target.value)}
                        className="w-14 border-x border-gray-300 py-1.5 text-center text-sm outline-none"
                      />
                      <button
                        type="button"
                        className="px-3 py-1.5 text-gray-700 hover:bg-gray-100"
                        onClick={() =>
                          updateQuantity(item.productId, Math.min(Number(item.countInStock || 9999), Number(item.quantity) + 1))
                        }
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-gray-800">
                      Subtotal: ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Total Items</span>
                <span className="font-semibold">{totalItemCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Price</span>
                <span className="text-base font-bold text-indigo-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={clearCart}
              className="mt-5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Clear Cart
            </button>

            <Link
              to="/checkout"
              className="mt-3 block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

export default CartPage;
