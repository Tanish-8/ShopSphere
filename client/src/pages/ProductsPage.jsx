import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import useProducts from "../hooks/useProducts";

const fallbackImage = "https://via.placeholder.com/500x360?text=Product";

function getProductId(product) {
  return product._id || product.id;
}

function getProductName(product) {
  return product.name || product.title || "Untitled Product";
}

function getProductCategory(product) {
  return product.category?.name || product.category || "General";
}

function getProductPrice(product) {
  const value = Number(product.price || product.salePrice || 0);
  return `$${value.toFixed(2)}`;
}

function getProductRating(product) {
  const value = Number(product.rating || product.averageRating || product.ratings?.average || 0);
  return Math.max(0, Math.min(5, Math.round(value)));
}

function getProductImage(product) {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
  return product.image || product.thumbnail || fallbackImage;
}

function ProductsPage() {
  const { products, loading, error } = useProducts();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popularity");
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => {
    const unique = new Set(products.map((product) => getProductCategory(product)));
    return ["All", ...Array.from(unique)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "All") {
      result = result.filter((product) => getProductCategory(product) === selectedCategory);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter((product) => getProductName(product).toLowerCase().includes(query));
    }

    if (sortBy === "priceLow") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "priceHigh") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return result;
  }, [products, search, selectedCategory, sortBy]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
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

          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 lg:w-56"
          >
            <option value="popularity">Sort: Popularity</option>
            <option value="priceLow">Sort: Price Low to High</option>
            <option value="priceHigh">Sort: Price High to Low</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category);
                setCurrentPage(1);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selectedCategory === category
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {!loading &&
          !error &&
          paginatedProducts.map((product) => (
            <article key={getProductId(product)} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <img src={getProductImage(product)} alt={getProductName(product)} className="h-44 w-full object-cover" />
              <div className="space-y-2 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{getProductCategory(product)}</p>
                <h2 className="font-semibold text-gray-900">{getProductName(product)}</h2>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-indigo-600">{getProductPrice(product)}</span>
                  <span className="text-sm text-amber-500">{"★".repeat(getProductRating(product) || 1)}</span>
                </div>
                <Link
                  to={`/products/${getProductId(product)}`}
                  className="mt-2 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}

        {loading && (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
            Loading products...
          </div>
        )}

        {!loading && error && (
          <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && paginatedProducts.length === 0 && (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
            No products found.
          </div>
        )}
      </section>

      <section className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setCurrentPage(page)}
            className={`rounded-lg px-3 py-2 text-sm ${
              currentPage === page ? "bg-indigo-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </section>
    </div>
  );
}

export default ProductsPage;
