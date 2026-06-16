import { Link } from "react-router-dom";

const featuredProducts = [
  { id: "p1", name: "Noise-Canceling Headphones", price: "$129", image: "https://via.placeholder.com/500x360?text=Headphones" },
  { id: "p2", name: "Smart Fitness Watch", price: "$89", image: "https://via.placeholder.com/500x360?text=Watch" },
  { id: "p3", name: "Minimal Leather Backpack", price: "$74", image: "https://via.placeholder.com/500x360?text=Backpack" },
  { id: "p4", name: "Wireless Mechanical Keyboard", price: "$99", image: "https://via.placeholder.com/500x360?text=Keyboard" }
];

const categories = [
  { name: "Electronics", count: "120+ items" },
  { name: "Fashion", count: "80+ items" },
  { name: "Home & Living", count: "95+ items" },
  { name: "Beauty", count: "60+ items" }
];

const bestSellers = [
  "Ultra HD Smart TV",
  "Premium Running Shoes",
  "Portable Bluetooth Speaker",
  "Organic Skin Care Kit"
];

function HomePage() {
  return (
    <div className="space-y-16">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-14 text-white shadow-lg sm:px-10">
        <p className="text-sm font-medium uppercase tracking-wider text-indigo-100">Shop smarter every day</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
          Discover trend-setting products for your lifestyle
        </h1>
        <p className="mt-4 max-w-xl text-sm text-indigo-100 sm:text-base">
          Explore the latest arrivals, best deals, and customer favorites in one modern shopping experience.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            to="/products"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            Shop Now
          </Link>
          <button
            type="button"
            className="rounded-full border border-indigo-200 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            View Deals
          </button>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/products" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View all
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <img src={product.image} alt={product.name} className="h-44 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="mt-2 text-sm font-medium text-indigo-600">{product.price}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Shop by Category</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <article
              key={category.name}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-300"
            >
              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{category.count}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900">Best Sellers</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {bestSellers.map((item) => (
            <div key={item} className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50 px-6 py-8 sm:px-8">
        <h2 className="text-2xl font-bold text-gray-900">Get Exclusive Offers</h2>
        <p className="mt-2 text-sm text-gray-600">Subscribe to our newsletter and never miss new arrivals and flash sales.</p>
        <form className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            placeholder="Enter your email address"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}

export default HomePage;
