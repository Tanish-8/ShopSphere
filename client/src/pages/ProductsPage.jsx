import { Link, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { fetchProducts } from "../services/productService";
import { FALLBACK_PRODUCT_IMAGE } from "../utils/productImage";
import axios from "axios";

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
  return product.image || product.thumbnail || FALLBACK_PRODUCT_IMAGE;
}

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const querySearch = searchParams.get("search") || "";
  const queryCategory = searchParams.get("category") || "All";
  const querySort = searchParams.get("sort") || "popularity";
  const queryPage = parseInt(searchParams.get("page"), 10) || 1;

  // Local state for interactive instant input typing before debounce fires
  const [searchTerm, setSearchTerm] = useState(querySearch);

  // States for products fetch results
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Sync local input box search value with URL query changes (e.g. Back/Forward)
  useEffect(() => {
    setSearchTerm(querySearch);
  }, [querySearch]);

  // Handle category fetch on mount (load once so that buttons list remains fully available)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const allProducts = await fetchProducts({ limit: 100 });
        const unique = new Set(allProducts.map((p) => getProductCategory(p)));
        if (mounted) {
          setCategories(["All", ...Array.from(unique)]);
        }
      } catch (err) {
        if (mounted) {
          // Robust static fallback
          setCategories(["All", "Electronics", "Fashion", "Home & Living", "Beauty"]);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Debounce effect: sync input change to URL searchParams after 400ms delay
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm !== querySearch) {
        setSearchParams((prev) => {
          if (searchTerm.trim()) {
            prev.set("search", searchTerm.trim());
          } else {
            prev.delete("search");
          }
          prev.set("page", "1"); // Reset to page 1
          return prev;
        });
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, querySearch, setSearchParams]);

  // Core callback function to load filtered and sorted backend data
  const fetchFilteredProducts = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: queryPage,
        limit: 8,
        sort: querySort,
        category: queryCategory !== "All" ? queryCategory : undefined,
        search: querySearch || undefined
      };

      const data = await fetchProducts(params, signal);
      setProducts(data);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.totalProducts || 0);
    } catch (err) {
      if (err.name !== "CanceledError" && !axios.isCancel(err)) {
        setError(err?.response?.data?.message || err.message || "Failed to load products.");
      }
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  }, [queryPage, queryCategory, querySort, querySearch]);

  // Trigger query fetch whenever search parameters in URL change, managing abort controllers
  useEffect(() => {
    const controller = new AbortController();
    fetchFilteredProducts(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchFilteredProducts]);

  const handleCategoryChange = (category) => {
    setSearchParams((prev) => {
      if (category && category !== "All") {
        prev.set("category", category);
      } else {
        prev.delete("category");
      }
      prev.set("page", "1");
      return prev;
    });
  };

  const handleSortChange = (sort) => {
    setSearchParams((prev) => {
      prev.set("sort", sort);
      prev.set("page", "1");
      return prev;
    });
  };

  const handlePageChange = (page) => {
    setSearchParams((prev) => {
      prev.set("page", String(page));
      return prev;
    });
  };

  const handleRetry = () => {
    fetchFilteredProducts();
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
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
            value={querySort}
            onChange={(event) => handleSortChange(event.target.value)}
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
              onClick={() => handleCategoryChange(category)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                queryCategory === category
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
          products.map((product) => (
            <article key={getProductId(product)} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <img src={getProductImage(product)} alt={getProductName(product)} className="h-44 w-full object-cover" />
              <div className="space-y-2 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{getProductCategory(product)}</p>
                <h2 className="font-semibold text-gray-900">{getProductName(product)}</h2>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-indigo-600">{getProductPrice(product)}</span>
                  <span className="text-sm text-amber-500">{"★".repeat(getProductRating(product) || 1)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Link
                    to={`/products/${getProductId(product)}`}
                    className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                  >
                    View Details
                  </Link>
                  <Link to={`/products/${getProductId(product)}`} className="text-sm text-gray-500">Quick View</Link>
                </div>
              </div>
            </article>
          ))}

        {loading && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-gray-500">Loading products...</span>
          </div>
        )}

        {!loading && error && (
          <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            <p className="mb-2">{error}</p>
            <button onClick={handleRetry} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            <span className="block text-2xl mb-2">🔍</span>
            <span className="font-semibold text-gray-700 block">No products found</span>
            <span className="text-gray-400">Try adjusting your filters or search keywords.</span>
          </div>
        )}
      </section>

      {!loading && !error && products.length > 0 && (
        <section className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(1, queryPage - 1))}
            disabled={queryPage === 1}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              className={`rounded-lg px-3 py-2 text-sm ${
                queryPage === page ? "bg-indigo-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePageChange(Math.min(totalPages, queryPage + 1))}
            disabled={queryPage === totalPages}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </section>
      )}
    </div>
  );
}

export default ProductsPage;
