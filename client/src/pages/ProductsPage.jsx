import { Link } from "react-router-dom";

const products = [
  { id: "1", name: "Smartphone Pro Max", category: "Electronics", price: "$799", rating: 4.7, image: "https://via.placeholder.com/500x360?text=Smartphone" },
  { id: "2", name: "Running Sneakers", category: "Fashion", price: "$119", rating: 4.5, image: "https://via.placeholder.com/500x360?text=Sneakers" },
  { id: "3", name: "Ceramic Dinner Set", category: "Home & Living", price: "$59", rating: 4.4, image: "https://via.placeholder.com/500x360?text=Dinner+Set" },
  { id: "4", name: "Hydrating Serum", category: "Beauty", price: "$34", rating: 4.8, image: "https://via.placeholder.com/500x360?text=Serum" },
  { id: "5", name: "Gaming Mouse", category: "Electronics", price: "$45", rating: 4.6, image: "https://via.placeholder.com/500x360?text=Gaming+Mouse" },
  { id: "6", name: "Oversized Hoodie", category: "Fashion", price: "$49", rating: 4.3, image: "https://via.placeholder.com/500x360?text=Hoodie" },
  { id: "7", name: "Aroma Diffuser", category: "Home & Living", price: "$28", rating: 4.4, image: "https://via.placeholder.com/500x360?text=Diffuser" },
  { id: "8", name: "Lip Tint Set", category: "Beauty", price: "$22", rating: 4.2, image: "https://via.placeholder.com/500x360?text=Lip+Tint" }
];

const categories = ["All", "Electronics", "Fashion", "Home & Living", "Beauty"];

function ProductsPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full rounded-full border border-gray-300 bg-gray-50 px-4 py-2.5 pl-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <svg className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 3a6 6 0 104.472 10.001l3.263 3.264a1 1 0 001.414-1.414l-3.264-3.263A6 6 0 009 3zm-4 6a4 4 0 118 0 4 4 0 01-8 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <select className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 lg:w-56">
            <option>Sort: Popularity</option>
            <option>Sort: Price Low to High</option>
            <option>Sort: Price High to Low</option>
            <option>Sort: Newest</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <img src={product.image} alt={product.name} className="h-44 w-full object-cover" />
            <div className="space-y-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{product.category}</p>
              <h2 className="font-semibold text-gray-900">{product.name}</h2>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-indigo-600">{product.price}</span>
                <span className="text-sm text-amber-500">{"★".repeat(Math.round(product.rating - 0.1))}</span>
              </div>
              <Link
                to={`/products/${product.id}`}
                className="mt-2 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                View Details
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <button type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Previous
        </button>
        <button type="button" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">
          1
        </button>
        <button type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
          2
        </button>
        <button type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
          3
        </button>
        <button type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Next
        </button>
      </section>
    </div>
  );
}

export default ProductsPage;
