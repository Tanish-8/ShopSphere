import { Link, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import { fetchProducts } from "../services/productService";
import ProductCard from "../components/product/ProductCard";
import { addToWishlist, removeFromWishlist, fetchWishlist } from "../services/wishlistService";
import axios from "axios";
import { CATEGORIES } from "../../../shared/categories.js";
import { useToast } from "../contexts/ToastContext";

const POPULAR_BRANDS = [
  "Apple",
  "Samsung",
  "Sony",
  "Nike",
  "Adidas",
  "Philips",
  "Logitech",
  "Dyson",
  "Lego",
  "Hasbro",
  "Starbucks"
];

function getProductId(product) {
  return product._id || product.id;
}

function getProductName(product) {
  return product.name || "Untitled Product";
}

function getProductCategory(product) {
  return product.category || "General";
}

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
    <div className="bg-gray-100 h-48 w-full rounded-xl"></div>
    <div className="flex justify-between items-center">
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-3.5 bg-gray-200 rounded w-1/3"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-9 bg-gray-200 rounded-xl w-full"></div>
  </div>
);

function ProductsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const querySearch = searchParams.get("search") || "";
  const queryCategory = searchParams.get("category") || "All";
  const querySort = searchParams.get("sort") || "popularity";
  const queryPage = parseInt(searchParams.get("page"), 10) || 1;
  const queryFeatured = searchParams.get("featured") || "";

  const queryBrand = searchParams.get("brand") || "";
  const queryRating = searchParams.get("rating") || "";
  const queryAvailability = searchParams.get("availability") || "";
  const queryDiscount = searchParams.get("discount") || "";
  const queryBadge = searchParams.get("badge") || "";
  const queryMinPrice = searchParams.get("minPrice") || "";
  const queryMaxPrice = searchParams.get("maxPrice") || "";

  // Local inputs
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const [minPrice, setMinPrice] = useState(queryMinPrice);
  const [maxPrice, setMaxPrice] = useState(queryMaxPrice);

  // States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [wishlistIds, setWishlistIds] = useState([]);

  // Sync inputs with URL changes
  useEffect(() => {
    setSearchTerm(querySearch);
  }, [querySearch]);

  useEffect(() => {
    setMinPrice(queryMinPrice);
  }, [queryMinPrice]);

  useEffect(() => {
    setMaxPrice(queryMaxPrice);
  }, [queryMaxPrice]);

  // Load wishlist
  const loadWishlist = useCallback(async () => {
    try {
      const list = await fetchWishlist();
      setWishlistIds(list.map((p) => p._id || p.id));
    } catch {
      // Unauthenticated
    }
  }, []);

  useEffect(() => {
    loadWishlist();
    window.addEventListener("wishlist-updated", loadWishlist);
    return () => {
      window.removeEventListener("wishlist-updated", loadWishlist);
    };
  }, [loadWishlist]);

  // Load categories from shared canonical list
  useEffect(() => {
    setCategories(["All", ...CATEGORIES]);
  }, []);

  // Debounce search term sync to URL
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm !== querySearch) {
        setSearchParams((prev) => {
          if (searchTerm.trim()) {
            prev.set("search", searchTerm.trim());
          } else {
            prev.delete("search");
          }
          prev.set("page", "1");
          return prev;
        });
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, querySearch, setSearchParams]);

  // Fetch products callback
  const fetchFilteredProducts = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: queryPage,
        limit: 12,
        sort: querySort,
        category: queryCategory !== "All" ? queryCategory : undefined,
        search: querySearch || undefined,
        featured: queryFeatured === "true" ? "true" : undefined,
        brand: queryBrand || undefined,
        rating: queryRating || undefined,
        availability: queryAvailability || undefined,
        discount: queryDiscount || undefined,
        badge: queryBadge || undefined,
        minPrice: queryMinPrice || undefined,
        maxPrice: queryMaxPrice || undefined
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
  }, [
    queryPage,
    queryCategory,
    querySort,
    querySearch,
    queryFeatured,
    queryBrand,
    queryRating,
    queryAvailability,
    queryDiscount,
    queryBadge,
    queryMinPrice,
    queryMaxPrice
  ]);

  // Trigger query fetch
  useEffect(() => {
    const controller = new AbortController();
    fetchFilteredProducts(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchFilteredProducts]);

  // Actions
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

  const handleWishlistToggle = async (productId) => {
    const prod = products.find((p) => (p._id || p.id) === productId);
    const prodName = prod ? prod.name : "Product";
    const toastId = toast.loading("Updating Wishlist...");

    try {
      const isWishlisted = wishlistIds.includes(productId);
      if (isWishlisted) {
        await removeFromWishlist(productId);
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
        toast.dismiss(toastId);
        toast.info("Removed from Wishlist", (
          <p className="font-bold text-gray-900">{prodName}</p>
        ));
      } else {
        await addToWishlist(productId);
        setWishlistIds((prev) => [...prev, productId]);
        toast.dismiss(toastId);
        toast.success("Added to Wishlist", (
          <div className="space-y-1">
            <p className="font-extrabold text-gray-900 leading-tight">{prodName}</p>
            <div className="flex gap-2.5 pt-1 text-[10px] font-black text-indigo-600">
              <a href="/wishlist" className="hover:underline">View Wishlist</a>
              <span className="text-gray-300">|</span>
              <a href="/products" className="hover:underline">Continue Shopping</a>
            </div>
          </div>
        ));
      }
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Something went wrong.", "Please try again.");
      console.error("Failed to update wishlist:", err);
    }
  };

  // Filters State Mappings
  const selectedBrands = useMemo(() => (queryBrand ? queryBrand.split(",") : []), [queryBrand]);
  const selectedAvailability = useMemo(() => (queryAvailability ? queryAvailability.split(",") : []), [queryAvailability]);
  const selectedBadges = useMemo(() => (queryBadge ? queryBadge.split(",") : []), [queryBadge]);

  const handleBrandToggle = (brand) => {
    setSearchParams((prev) => {
      let list = [...selectedBrands];
      if (list.includes(brand)) {
        list = list.filter((b) => b !== brand);
      } else {
        list.push(brand);
      }
      if (list.length > 0) prev.set("brand", list.join(","));
      else prev.delete("brand");
      prev.set("page", "1");
      return prev;
    });
  };

  const handleAvailabilityToggle = (av) => {
    setSearchParams((prev) => {
      let list = [...selectedAvailability];
      if (list.includes(av)) {
        list = list.filter((a) => a !== av);
      } else {
        list.push(av);
      }
      if (list.length > 0) prev.set("availability", list.join(","));
      else prev.delete("availability");
      prev.set("page", "1");
      return prev;
    });
  };

  const handleBadgeToggle = (bg) => {
    setSearchParams((prev) => {
      let list = [...selectedBadges];
      if (list.includes(bg)) {
        list = list.filter((b) => b !== bg);
      } else {
        list.push(bg);
      }
      if (list.length > 0) prev.set("badge", list.join(","));
      else prev.delete("badge");
      prev.set("page", "1");
      return prev;
    });
  };

  const handleRatingSelect = (stars) => {
    setSearchParams((prev) => {
      if (prev.get("rating") === String(stars)) {
        prev.delete("rating");
      } else {
        prev.set("rating", String(stars));
      }
      prev.set("page", "1");
      return prev;
    });
  };

  const handleDiscountChange = (disc) => {
    setSearchParams((prev) => {
      if (prev.get("discount") === disc) {
        prev.delete("discount");
      } else {
        prev.set("discount", disc);
      }
      prev.set("page", "1");
      return prev;
    });
  };

  const handlePriceApply = () => {
    setSearchParams((prev) => {
      if (minPrice) prev.set("minPrice", minPrice);
      else prev.delete("minPrice");

      if (maxPrice) prev.set("maxPrice", maxPrice);
      else prev.delete("maxPrice");

      prev.set("page", "1");
      return prev;
    });
  };

  const handleClearFilters = () => {
    setSearchParams((prev) => {
      prev.delete("brand");
      prev.delete("availability");
      prev.delete("badge");
      prev.delete("rating");
      prev.delete("discount");
      prev.delete("minPrice");
      prev.delete("maxPrice");
      prev.delete("search");
      prev.set("page", "1");
      return prev;
    });
    setMinPrice("");
    setMaxPrice("");
    setSearchTerm("");
  };

  // Pagination helper
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (queryPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, queryPage - 1);
      const end = Math.min(totalPages - 1, queryPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (queryPage < totalPages - 2) {
        pages.push("...");
      }
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const startItem = (queryPage - 1) * 12 + 1;
  const endItem = Math.min(queryPage * 12, totalProducts);

  return (
    <div className="space-y-6">
      {/* Search and Sort Header Card */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search by name, brand, tags or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 pl-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <svg className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 3a6 6 0 104.472 10.001l3.263 3.264a1 1 0 001.414-1.414l-3.264-3.263A6 6 0 009 3zm-4 6a4 4 0 118 0 4 4 0 01-8 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <select
            value={querySort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 md:w-56 cursor-pointer"
          >
            <option value="popularity">Sort: Popularity</option>
            <option value="newest">Sort: Newest</option>
            <option value="priceLow">Sort: Price Low to High</option>
            <option value="priceHigh">Sort: Price High to Low</option>
            <option value="highestRated">Sort: Highest Rated</option>
            <option value="mostReviewed">Sort: Most Reviewed</option>
            <option value="discount">Sort: Max Discount</option>
            <option value="az">Sort: Name A-Z</option>
          </select>
        </div>

        {/* Categories Bar */}
        <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                queryCategory === category
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Two Column Grid layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Filters Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Filters</h3>
              <button
                onClick={handleClearFilters}
                className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 cursor-pointer uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>

            {/* Price Filter */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Price Range</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handlePriceApply}
                className="w-full rounded-xl bg-indigo-50 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 cursor-pointer"
              >
                Apply Price
              </button>
            </div>

            {/* Brand Checkboxes */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Brand</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {POPULAR_BRANDS.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b)}
                      onChange={() => handleBrandToggle(b)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{b}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ratings Filter */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Rating</h4>
              <div className="space-y-1.5">
                {[4, 3, 2, 1].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => handleRatingSelect(stars)}
                    className={`flex items-center gap-1.5 text-xs font-semibold w-full text-left py-1.5 rounded-lg px-2.5 transition cursor-pointer ${
                      Number(queryRating) === stars
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-amber-400">{"★".repeat(stars) + "☆".repeat(5 - stars)}</span>
                    <span>& Up</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Availability</h4>
              <div className="space-y-2">
                {[
                  { key: "in_stock", label: "In Stock" },
                  { key: "low_stock", label: "Low Stock (≤ 5)" },
                  { key: "out_of_stock", label: "Out of Stock" }
                ].map((av) => (
                  <label key={av.key} className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedAvailability.includes(av.key)}
                      onChange={() => handleAvailabilityToggle(av.key)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{av.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Discount Filter */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Discount Offer</h4>
              <div className="space-y-2">
                {[
                  { val: "10", label: "10% Off or more" },
                  { val: "20", label: "20% Off or more" },
                  { val: "30", label: "30% Off or more" }
                ].map((disc) => (
                  <label key={disc.val} className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900">
                    <input
                      type="radio"
                      name="discountRadio"
                      checked={queryDiscount === disc.val}
                      onClick={() => handleDiscountChange(disc.val)}
                      onChange={() => {}} // Handled by onClick for toggle support
                      className="border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{disc.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Badges Filter */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Special Badges</h4>
              <div className="space-y-2">
                {[
                  { val: "Best Seller", label: "Best Seller" },
                  { val: "Trending", label: "Trending" },
                  { val: "Top Rated", label: "Top Rated" }
                ].map((bg) => (
                  <label key={bg.val} className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedBadges.includes(bg.val)}
                      onChange={() => handleBadgeToggle(bg.val)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{bg.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Grid and Pagination */}
        <div className="flex-1 w-full space-y-6">
          {/* Pagination Counter */}
          {!loading && !error && products.length > 0 && (
            <div className="text-xs font-bold text-gray-500 text-left">
              Showing <span className="text-gray-900">{startItem}–{endItem}</span> of <span className="text-gray-900">{totalProducts}</span> products
            </div>
          )}

          {/* Grid Section */}
          <section className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(290px,1fr))]">
            {loading && Array.from({ length: 9 }).map((_, index) => <SkeletonCard key={index} />)}

            {!loading &&
              !error &&
              products.map((product) => (
                <ProductCard
                  key={getProductId(product)}
                  product={product}
                  isWishlisted={wishlistIds.includes(getProductId(product))}
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}

            {!loading && error && (
              <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-xs font-bold text-red-700">
                <p className="mb-3">{error}</p>
                <button
                  onClick={() => fetchFilteredProducts()}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition cursor-pointer"
                >
                  Retry Loading
                </button>
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-16 text-center text-sm text-gray-500 flex flex-col items-center justify-center space-y-4">
                <span className="block text-4xl select-none">🔍</span>
                <span className="font-black text-gray-800 text-base">No Products Found</span>
                <span className="text-gray-400 max-w-xs">We couldn't find matches for your search keywords or applied filters.</span>
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </section>

          {/* Pagination Controls */}
          {!loading && !error && products.length > 0 && (
            <section className="flex flex-wrap items-center justify-center gap-1.5 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, queryPage - 1))}
                disabled={queryPage === 1}
                className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => typeof page === "number" && handlePageChange(page)}
                  disabled={page === "..."}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    queryPage === page
                      ? "bg-indigo-600 text-white shadow-sm"
                      : page === "..."
                      ? "text-gray-400 cursor-default"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages, queryPage + 1))}
                disabled={queryPage === totalPages}
                className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
