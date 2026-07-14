import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useCart from "../hooks/useCart";
import { addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemoveFromWishlist, fetchWishlist } from "../services/wishlistService";
import useAuth from "../hooks/useAuth";
import useProducts from "../hooks/useProducts";
import { fetchProductDetails, postProductReview, fetchProducts } from "../services/productService";
import { FALLBACK_PRODUCT_IMAGE } from "../utils/productImage";
import { useToast } from "../contexts/ToastContext";

function ProductDetailsPage() {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const { product: hookProduct, loading, error } = useProducts(id);
  const [productOverride, setProductOverride] = useState(null);
  const product = productOverride ?? hookProduct;
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Reset product override on ID change
  useEffect(() => {
    setProductOverride(null);
    setReviewPage(1);
    setReviewFilter("all");
    setReviewSort("newest");
    setQuantity(1);
  }, [id]);

  // Gallery calculations
  const galleryImages = useMemo(() => {
    if (!product) return [FALLBACK_PRODUCT_IMAGE];
    const mainImg = (Array.isArray(product.images) && product.images.length > 0)
      ? product.images[0]
      : product.image || FALLBACK_PRODUCT_IMAGE;

    if (mainImg.includes("unsplash.com")) {
      const cleanUrl = mainImg.split("?")[0];
      return [
        mainImg,
        `${cleanUrl}?auto=format&fit=crop&w=600&q=80&sig=1`,
        `${cleanUrl}?auto=format&fit=crop&w=600&q=80&sig=2`,
        `${cleanUrl}?auto=format&fit=crop&w=600&q=80&sig=3`
      ];
    }
    return [mainImg, mainImg, mainImg, mainImg];
  }, [product]);

  const [activeImage, setActiveImage] = useState(FALLBACK_PRODUCT_IMAGE);
  const [quantity, setQuantity] = useState(1);
  const [successMessage, setSuccessMessage] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Sync active image with changes in galleryImages
  useEffect(() => {
    if (galleryImages.length > 0) {
      setActiveImage(galleryImages[0]);
    }
  }, [galleryImages]);

  // Fetch wishlist status
  const loadWishlistStatus = useCallback(async () => {
    if (!product || !isAuthenticated) {
      setWishlisted(false);
      return;
    }
    try {
      const list = await fetchWishlist();
      setWishlisted(list.some((p) => (p._id || p.id) === (product._id || product.id)));
    } catch {
      // Ignore
    }
  }, [product, isAuthenticated]);

  useEffect(() => {
    loadWishlistStatus();
  }, [loadWishlistStatus]);

  // Form states for reviews
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Product properties
  const displayName = product?.name || product?.title || "Product";
  const displayCategory = product?.category?.name || product?.category || "General";
  const displayDescription = product?.description || "No description available for this product yet.";
  const price = Number(product?.price || 0);
  const originalPrice = Number(product?.originalPrice || price);
  const discount = Number(product?.discount || 0);
  const rating = Number(product?.rating || 0);
  const numReviews = Number(product?.numReviews || 0);
  const stock = Number(product?.stock ?? product?.countInStock ?? 0);
  const brand = product?.brand || "Unbranded";
  const sku = product?.sku || "N/A";
  const highlights = product?.features || [];

  // Variant States
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");

  const variantsConfig = useMemo(() => {
    const conf = { colors: [], sizes: [], storages: [] };
    if (!product) return conf;
    const cat = displayCategory.toLowerCase();

    if (cat.includes("electronics")) {
      conf.colors = ["Space Gray", "Silver", "Midnight Black"];
      if (displayName.toLowerCase().includes("phone") || displayName.toLowerCase().includes("kindle")) {
        conf.storages = ["128GB", "256GB", "512GB"];
      } else if (displayName.toLowerCase().includes("laptop") || displayName.toLowerCase().includes("pc")) {
        conf.storages = ["8GB RAM / 512GB", "16GB RAM / 1TB"];
      }
    } else if (cat.includes("fashion") || cat.includes("sports")) {
      conf.colors = ["Classic Black", "Navy Blue", "Heather Gray"];
      if (displayName.toLowerCase().includes("shoe") || displayName.toLowerCase().includes("sneaker")) {
        conf.sizes = ["8", "9", "10", "11"];
      } else {
        conf.sizes = ["S", "M", "L", "XL"];
      }
    } else if (cat.includes("home") || cat.includes("furniture") || cat.includes("kitchen")) {
      conf.colors = ["Natural Wood", "Walnut Brown", "Chalk White"];
      conf.sizes = ["Standard Size", "Premium Large"];
    } else {
      conf.colors = ["Default Color"];
    }
    return conf;
  }, [product, displayCategory, displayName]);

  useEffect(() => {
    if (variantsConfig.colors.length > 0) setSelectedColor(variantsConfig.colors[0]);
    if (variantsConfig.sizes.length > 0) setSelectedSize(variantsConfig.sizes[0]);
    if (variantsConfig.storages.length > 0) setSelectedStorage(variantsConfig.storages[0]);
  }, [variantsConfig]);

  // Dynamic pricing based on variants
  const variantPrice = useMemo(() => {
    let current = price;
    if (selectedStorage === "256GB" || selectedStorage === "16GB RAM / 1TB") current += 100;
    if (selectedStorage === "512GB") current += 250;
    if (selectedSize === "XL" || selectedSize === "11" || selectedSize === "Premium Large") current += 15;
    return current;
  }, [price, selectedStorage, selectedSize]);

  const variantOriginalPrice = useMemo(() => {
    if (discount > 0) {
      return Number((variantPrice / (1 - discount / 100)).toFixed(2));
    }
    return variantPrice;
  }, [variantPrice, discount]);

  const variantSavings = useMemo(() => {
    return Math.max(0, variantOriginalPrice - variantPrice);
  }, [variantOriginalPrice, variantPrice]);

  const variantSku = useMemo(() => {
    let clean = sku;
    if (selectedColor) clean += `-${selectedColor.substring(0, 2).toUpperCase()}`;
    if (selectedStorage) clean += `-${selectedStorage.substring(0, 3).toUpperCase()}`;
    if (selectedSize) clean += `-${selectedSize.toUpperCase()}`;
    return clean;
  }, [sku, selectedColor, selectedStorage, selectedSize]);

  const variantStock = useMemo(() => {
    let currentStock = stock;
    if (selectedColor === "Silver" || selectedColor === "Navy Blue") {
      currentStock = Math.max(0, currentStock - 3);
    }
    if (selectedColor === "Midnight Black") {
      currentStock = 0; // Simulate out of stock variant
    }
    return currentStock;
  }, [stock, selectedColor]);

  // Image Hover Zoom State
  const [zoomStyle, setZoomStyle] = useState({ display: "none" });
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      display: "block",
      backgroundImage: `url(${activeImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: "220%"
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: "none" });
  };

  // Fullscreen Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleLightboxPrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleLightboxNext = () => {
    setLightboxIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  // Rating Distribution
  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const reviews = product?.reviews || [];
    if (reviews.length > 0) {
      reviews.forEach((r) => {
        const ratingVal = Math.round(r.rating || 5);
        if (dist[ratingVal] !== undefined) {
          dist[ratingVal]++;
        }
      });
      const total = reviews.length;
      Object.keys(dist).forEach((k) => {
        dist[k] = Math.round((dist[k] / total) * 100);
      });
    } else {
      const avg = rating || 4.5;
      if (avg >= 4.7) {
        dist[5] = 75; dist[4] = 18; dist[3] = 4; dist[2] = 2; dist[1] = 1;
      } else if (avg >= 4.4) {
        dist[5] = 60; dist[4] = 25; dist[3] = 10; dist[2] = 3; dist[1] = 2;
      } else if (avg >= 4.0) {
        dist[5] = 45; dist[4] = 30; dist[3] = 15; dist[2] = 7; dist[1] = 3;
      } else {
        dist[5] = 30; dist[4] = 30; dist[3] = 25; dist[2] = 10; dist[1] = 5;
      }
    }
    return dist;
  }, [product, rating]);

  // Review filtering / sorting / pagination
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewPage, setReviewPage] = useState(1);
  const [helpfulVotes, setHelpfulVotes] = useState({});

  const filteredAndSortedReviews = useMemo(() => {
    let list = Array.isArray(product?.reviews) ? [...product.reviews] : [];

    if (reviewFilter !== "all") {
      list = list.filter((r) => Math.round(r.rating || 5) === Number(reviewFilter));
    }

    if (reviewSort === "newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (reviewSort === "highest") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (reviewSort === "lowest") {
      list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }
    return list;
  }, [product, reviewFilter, reviewSort]);

  const paginatedReviews = useMemo(() => {
    const start = (reviewPage - 1) * 3;
    return filteredAndSortedReviews.slice(start, start + 3);
  }, [filteredAndSortedReviews, reviewPage]);

  const totalReviewPages = Math.ceil(filteredAndSortedReviews.length / 3) || 1;

  const handleVoteHelpful = (reviewId) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1
    }));
  };

  // Add to cart action
  const handleAddToCart = () => {
    if (variantStock <= 0) return;
    addItem(
      {
        productId: product._id || product.id,
        name: displayName,
        image: galleryImages[0],
        price: Number(variantPrice),
        countInStock: Math.max(0, variantStock)
      },
      quantity
    );
    setSuccessMessage("Added to your shopping cart!");
  };

  const handleBuyNow = () => {
    if (variantStock <= 0) return;
    addItem(
      {
        productId: product._id || product.id,
        name: displayName,
        image: galleryImages[0],
        price: Number(variantPrice),
        countInStock: Math.max(0, variantStock)
      },
      quantity
    );
    navigate("/checkout");
  };

  // Wishlist toggle
  const handleWishlistClick = async () => {
    if (!isAuthenticated) return navigate("/login");
    const toastId = toast.loading("Updating Wishlist...");
    try {
      const pId = product._id || product.id;
      if (wishlisted) {
        await apiRemoveFromWishlist(pId);
        setWishlisted(false);
        toast.dismiss(toastId);
        toast.info("Removed from Wishlist", (
          <p className="font-bold text-gray-905">{product.name}</p>
        ));
      } else {
        await apiAddToWishlist(pId);
        setWishlisted(true);
        toast.dismiss(toastId);
        toast.success("Added to Wishlist", (
          <div className="space-y-1">
            <p className="font-extrabold text-gray-900 leading-tight">{product.name}</p>
            <div className="flex gap-2.5 pt-1 text-[10px] font-black text-indigo-650">
              <a href="/wishlist" className="hover:underline">View Wishlist</a>
              <span className="text-gray-300">|</span>
              <a href="/products" className="hover:underline">Continue Shopping</a>
            </div>
          </div>
        ));
      }
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Something went wrong.", "Please try again.");
      console.error(e);
    }
  };

  // Share action
  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Submit Review Form
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError("");
    setSubmittingReview(true);
    try {
      const pId = product._id || product.id;
      await postProductReview(pId, { rating: ratingInput, comment: commentInput });
      const updated = await fetchProductDetails(pId);
      setProductOverride(updated);
      setCommentInput("");
      setSuccessMessage("Review posted successfully!");
    } catch (err) {
      setReviewError(err?.response?.data?.message || err?.message || "Failed to post review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Related Products loading
  const [relatedProducts, setRelatedProducts] = useState([]);
  useEffect(() => {
    if (!displayCategory || !product) return;
    let mounted = true;
    (async () => {
      try {
        const list = await fetchProducts({ category: displayCategory, limit: 5 });
        if (mounted) {
          const filtered = list.filter((p) => (p._id || p.id) !== (product._id || product.id));
          setRelatedProducts(filtered);
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [displayCategory, product]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-650"></div>
        <p className="text-sm font-bold text-gray-500">Loading product information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm font-bold text-rose-700 shadow-xs">
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm font-bold text-gray-500 shadow-xs">
        Product could not be found.
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Dynamic breadcrumb */}
      <nav className="text-xs font-bold text-gray-400 flex items-center gap-2 select-none text-left">
        <Link to="/" className="hover:text-indigo-650 transition">Home</Link>
        <span>/</span>
        <Link to={`/products?category=${encodeURIComponent(displayCategory)}`} className="hover:text-indigo-650 transition">
          {displayCategory}
        </Link>
        <span>/</span>
        <span className="text-gray-650 line-clamp-1">{displayName}</span>
      </nav>

      {/* Main product setup grid */}
      <section className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Gallery Column (Desktop: Left, span 5) */}
        <div className="lg:col-span-5 flex flex-col md:flex-row gap-4">
          {/* Vertical thumbnails for large screens */}
          <div className="hidden md:flex flex-col gap-2.5 w-18 flex-shrink-0">
            {galleryImages.map((image, index) => (
              <button
                key={index}
                type="button"
                className={`w-18 h-18 rounded-lg overflow-hidden border-2 bg-gray-50 flex items-center justify-center transition-all ${
                  activeImage === image ? "border-indigo-600 scale-95 shadow-sm" : "border-gray-200 hover:border-gray-400"
                }`}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt={`thumbnail-${index}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          {/* Large display box */}
          <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs group">
            <div
              className="relative cursor-zoom-in aspect-square flex items-center justify-center overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleOpenLightbox(galleryImages.indexOf(activeImage))}
            >
              <img
                src={activeImage}
                alt={displayName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:opacity-0"
              />
              {/* Magic Zoom lens */}
              <div
                className="absolute inset-0 pointer-events-none border border-gray-100 hidden group-hover:block"
                style={zoomStyle}
              />
            </div>

            {/* Mobile Thumbnails List */}
            <div className="md:hidden flex gap-2 overflow-x-auto p-3 border-t border-gray-100 bg-gray-50/50">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  className={`w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 bg-white flex items-center justify-center ${
                    activeImage === image ? "border-indigo-600" : "border-gray-200"
                  }`}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt={`thumb-${index}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            {/* Click to expand instruction */}
            <span className="absolute bottom-3 right-3 text-[10px] font-extrabold uppercase bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded shadow-sm pointer-events-none select-none">
              Click to Expand
            </span>
          </div>
        </div>

        {/* Product Details Middle Column (span 4) */}
        <div className="lg:col-span-4 space-y-5 text-left">
          <div>
            <p className="text-2xs font-extrabold text-indigo-650 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded inline-block">
              {displayCategory}
            </p>
            <h1 className="mt-2.5 text-2xl font-black text-gray-900 leading-tight">
              {displayName}
            </h1>
            <p className="mt-1 text-xs text-gray-400 font-semibold">
              Brand: <Link to={`/products?brand=${encodeURIComponent(brand)}`} className="text-indigo-600 hover:underline">{brand}</Link> | SKU: <span className="text-gray-650">{variantSku}</span>
            </p>
          </div>

          {/* Ratings Summary */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <div className="flex text-amber-400 text-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
              ))}
            </div>
            <span className="text-xs font-bold text-gray-700">{rating.toFixed(1)} / 5</span>
            <span className="text-gray-300">|</span>
            <a href="#reviews" className="text-xs font-semibold text-indigo-600 hover:underline">
              {numReviews.toLocaleString()} customer reviews
            </a>
          </div>

          {/* Pricing Section */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-250/50 space-y-1.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-black text-gray-900">${variantPrice.toFixed(2)}</span>
              {discount > 0 && (
                <>
                  <span className="text-sm font-medium text-gray-400 line-through">${variantOriginalPrice.toFixed(2)}</span>
                  <span className="text-xs font-extrabold text-red-500 bg-red-55 px-2 py-0.5 rounded-md">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>
            {discount > 0 && (
              <p className="text-2xs font-black text-emerald-700 uppercase tracking-wider">
                You Save: ${variantSavings.toFixed(2)}
              </p>
            )}
            <p className="text-[10px] text-gray-400 font-bold">Inclusive of all taxes</p>
          </div>

          {/* Variants Selector */}
          <div className="space-y-4 pt-3 border-t border-gray-100">
            {variantsConfig.colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 block">Color: <span className="text-gray-500">{selectedColor}</span></span>
                <div className="flex flex-wrap gap-2">
                  {variantsConfig.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                        selectedColor === c
                          ? "border-indigo-650 bg-indigo-50 text-indigo-750 shadow-xs"
                          : "border-gray-200 bg-white text-gray-650 hover:border-gray-350"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {variantsConfig.storages.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 block">Configuration / Storage</span>
                <div className="flex flex-wrap gap-2">
                  {variantsConfig.storages.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedStorage(s)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                        selectedStorage === s
                          ? "border-indigo-650 bg-indigo-50 text-indigo-750 shadow-xs"
                          : "border-gray-200 bg-white text-gray-650 hover:border-gray-350"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {variantsConfig.sizes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 block">Size / Weight</span>
                <div className="flex flex-wrap gap-2">
                  {variantsConfig.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                        selectedSize === sz
                          ? "border-indigo-650 bg-indigo-50 text-indigo-750 shadow-xs"
                          : "border-gray-200 bg-white text-gray-650 hover:border-gray-350"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Key Highlights</h3>
              <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1.5 leading-relaxed">
                {highlights.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky Purchase Box Column (span 3) */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs text-left space-y-4">
            {/* Stock indicator */}
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${
                variantStock === 0
                  ? "bg-red-500 animate-pulse"
                  : variantStock <= 5
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500"
              }`} />
              <span className={`text-xs font-bold ${
                variantStock === 0
                  ? "text-red-650"
                  : variantStock <= 5
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}>
                {variantStock === 0 ? "Out of Stock" : variantStock <= 5 ? `Only ${variantStock} Left - Limited Stock` : "In Stock"}
              </span>
            </div>

            {variantStock === 0 && (
              <p className="text-[10px] text-gray-400 font-bold bg-gray-55 p-2 rounded">
                Expected Restock: within 5-7 days.
              </p>
            )}

            {/* Price duplicate */}
            <div className="border-t border-gray-100 pt-3">
              <span className="text-2xs font-extrabold text-gray-400 block uppercase">Checkout Price</span>
              <span className="text-xl font-black text-gray-900">${variantPrice.toFixed(2)}</span>
            </div>

            {/* Quantity Selector */}
            {variantStock > 0 && (
              <div className="space-y-1.5">
                <label className="text-2xs font-extrabold text-gray-400 uppercase block">Quantity</label>
                <div className="flex items-center rounded-xl border border-gray-300 w-full overflow-hidden">
                  <button
                    type="button"
                    disabled={quantity === 1}
                    className="w-10 py-2 text-sm font-bold text-gray-600 bg-gray-55 hover:bg-gray-100 transition disabled:opacity-40 disabled:hover:bg-gray-55"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    readOnly
                    value={quantity}
                    className="flex-1 text-center text-xs font-bold outline-none select-none border-0"
                  />
                  <button
                    type="button"
                    disabled={quantity >= variantStock}
                    className="w-10 py-2 text-sm font-bold text-gray-600 bg-gray-55 hover:bg-gray-100 transition disabled:opacity-40 disabled:hover:bg-gray-55"
                    onClick={() => setQuantity((prev) => Math.min(variantStock, prev + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={variantStock === 0}
                onClick={handleAddToCart}
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-black text-white hover:bg-indigo-700 active:scale-97 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                Add to Cart
              </button>
              <button
                type="button"
                disabled={variantStock === 0}
                onClick={handleBuyNow}
                className="w-full rounded-xl bg-amber-500 py-3 text-xs font-black text-gray-900 hover:bg-amber-600 active:scale-97 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                Buy Now
              </button>
            </div>

            {/* Share, Wishlist, Compare buttons */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 gap-2 flex-wrap">
              <button
                onClick={handleWishlistClick}
                className={`flex items-center gap-1 text-2xs font-extrabold transition px-2.5 py-1.5 rounded-lg ${
                  wishlisted ? "bg-red-55 text-red-650" : "bg-gray-55 text-gray-650 hover:bg-gray-100"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{wishlisted ? "Wishlisted" : "Wishlist"}</span>
              </button>

              <button
                onClick={handleShareClick}
                className="flex items-center gap-1 text-2xs font-extrabold text-gray-650 bg-gray-55 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.636-2.318m0 4.116l-4.636-2.318m1.282 5.702a3 3 0 11-6 0 3 3 0 016 0zM12 5a3 3 0 11-6 0 3 3 0 016 0zm7 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{shareCopied ? "Copied!" : "Share"}</span>
              </button>
            </div>

            {successMessage && (
              <p className="text-2xs font-bold text-center text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                {successMessage}
              </p>
            )}
          </div>

          {/* Delivery & Protection information */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5 text-left text-xs text-gray-500 space-y-3.5 shadow-2xs">
            <div className="flex gap-2.5 items-start">
              <span className="text-lg">🚚</span>
              <div>
                <p className="font-bold text-gray-950">Fast Delivery</p>
                <p className="text-[10px] text-gray-500">Get it within 2-3 working days. Express shipping active.</p>
              </div>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="text-lg">💰</span>
              <div>
                <p className="font-bold text-gray-950">Pay on Delivery</p>
                <p className="text-[10px] text-gray-500">Cash on Delivery available on this product.</p>
              </div>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="text-lg">🔄</span>
              <div>
                <p className="font-bold text-gray-950">7 Days Returnable</p>
                <p className="text-[10px] text-gray-500">Hassle-free replacements and refunds eligible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description & Technical specifications */}
      <section className="grid gap-6 md:grid-cols-2 items-start text-left pt-6 border-t border-gray-150">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2">Product Description</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Overview</h3>
              <p className="text-xs text-gray-650 mt-1 leading-relaxed">{displayDescription}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Warranty & Support</h3>
              <p className="text-xs text-gray-650 mt-1">1 Year Manufacturer Warranty. Please contact customer support for repairs or replacements.</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Seller Information</h3>
              <p className="text-xs text-gray-650 mt-1">Sold and fulfilled by <span className="font-bold text-indigo-650">ShopSphere Retail Solutions</span>.</p>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2">Technical Specifications</h2>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-xs text-left">
              <tbody>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <td className="px-4 py-2.5 font-bold text-gray-500 w-1/3">Brand</td>
                  <td className="px-4 py-2.5 font-bold text-gray-800">{brand}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2.5 font-bold text-gray-500">Model SKU</td>
                  <td className="px-4 py-2.5 font-bold text-gray-800">{variantSku}</td>
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <td className="px-4 py-2.5 font-bold text-gray-500">Category</td>
                  <td className="px-4 py-2.5 font-bold text-gray-800">{displayCategory}</td>
                </tr>
                {Object.entries(product.specifications || {}).map(([key, val], idx) => (
                  <tr key={key} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                    <td className="px-4 py-2.5 font-bold text-gray-500 capitalize">{key}</td>
                    <td className="px-4 py-2.5 font-bold text-gray-800">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Customer reviews section */}
      <section id="reviews" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8 text-left space-y-6">
        <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3">Ratings & Customer Reviews</h2>
        
        <div className="grid gap-6 md:grid-cols-12 items-start">
          {/* Summary */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-gray-900">{rating.toFixed(1)}</span>
              <div>
                <div className="flex text-amber-400 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
                  ))}
                </div>
                <span className="text-xs text-gray-400 font-bold">{numReviews.toLocaleString()} global ratings</span>
              </div>
            </div>

            {/* Distribution Graph */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-2.5 text-xs text-gray-650">
                  <button
                    onClick={() => setReviewFilter(reviewFilter === String(stars) ? "all" : String(stars))}
                    className="w-10 hover:text-indigo-650 text-left font-bold"
                  >
                    {stars} Star
                  </button>
                  <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${ratingDistribution[stars]}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-bold text-gray-400">{ratingDistribution[stars]}%</span>
                </div>
              ))}
            </div>

            {reviewFilter !== "all" && (
              <button
                onClick={() => setReviewFilter("all")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg"
              >
                Clear Filter ({reviewFilter} Star)
              </button>
            )}
          </div>

          {/* List and form */}
          <div className="md:col-span-8 space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Showing {filteredAndSortedReviews.length} Reviews
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-bold">Sort by:</span>
                <select
                  value={reviewSort}
                  onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {paginatedReviews.map((review) => (
                <article key={review._id || review.id} className="rounded-xl border border-gray-150 bg-gray-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{review.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-amber-500">{"★".repeat(Math.max(1, Math.round(review.rating || 0)))}</span>
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded uppercase tracking-wider">
                          Verified Purchase
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-650 leading-relaxed">{review.comment}</p>
                  
                  {/* Helpful buttons */}
                  <div className="flex items-center gap-2.5 pt-1.5">
                    <button
                      onClick={() => handleVoteHelpful(review._id || review.id)}
                      className="text-[10px] font-extrabold text-gray-500 bg-white hover:bg-gray-100 border border-gray-250 px-2 py-0.8 rounded-lg transition"
                    >
                      Helpful ({helpfulVotes[review._id || review.id] || 0})
                    </button>
                    <span className="text-[10px] text-gray-400">Report Abuse</span>
                  </div>
                </article>
              ))}

              {filteredAndSortedReviews.length === 0 && (
                <p className="text-xs text-gray-400 font-bold text-center py-6">No reviews fit this description yet.</p>
              )}
            </div>

            {/* Pagination reviews */}
            {totalReviewPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  disabled={reviewPage === 1}
                  onClick={() => setReviewPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-55 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-gray-555">
                  Page {reviewPage} of {totalReviewPages}
                </span>
                <button
                  disabled={reviewPage === totalReviewPages}
                  onClick={() => setReviewPage((prev) => Math.min(totalReviewPages, prev + 1))}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-55 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}

            {/* Form */}
            <div className="border-t border-gray-100 pt-5">
              {isAuthenticated ? (
                (product?.reviews || []).some((r) => r.user === user?._id || r.user?._id === user?._id) ? (
                  <p className="text-xs font-bold text-gray-450 bg-gray-50 p-3 rounded-lg text-center">
                    You have already reviewed this product.
                  </p>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900">Write a customer review</h4>
                    <div>
                      <label className="block text-2xs font-extrabold text-gray-450 uppercase mb-1">Your Rating</label>
                      <select
                        value={ratingInput}
                        onChange={(e) => setRatingInput(Number(e.target.value))}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none"
                      >
                        {[5, 4, 3, 2, 1].map((v) => (
                          <option key={v} value={v}>
                            {v} star{v > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-2xs font-extrabold text-gray-450 uppercase mb-1">Comment</label>
                      <textarea
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        rows={3}
                        required
                        placeholder="Write details of your experience with this product..."
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                    {reviewError && <p className="text-xs font-bold text-red-650">{reviewError}</p>}
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                )
              ) : (
                <p className="text-xs text-gray-500 font-bold bg-gray-50 p-3 rounded-lg text-center">
                  Please <Link to="/login" className="text-indigo-600 hover:underline">login</Link> to submit a customer review.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-gray-150 text-left">
          <h2 className="text-lg font-black text-gray-900">Similar Products You May Like</h2>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((rel) => {
              const relId = rel._id || rel.id;
              const relName = rel.name || "Untitled Product";
              const relImage = (Array.isArray(rel.images) && rel.images.length > 0)
                ? rel.images[0]
                : rel.image || FALLBACK_PRODUCT_IMAGE;
              return (
                <Link
                  key={relId}
                  to={`/products/${relId}`}
                  className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs transition hover:-translate-y-1 hover:shadow-xs p-3.5 space-y-2.5"
                >
                  <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative">
                    <img src={relImage} alt={relName} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block">{rel.brand || "Unbranded"}</span>
                    <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors mt-0.5">
                      {relName}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-amber-400 text-[10px]">★</span>
                      <span className="text-[10px] font-bold text-gray-500">{(rel.rating || 0).toFixed(1)}</span>
                    </div>
                    <span className="text-sm font-black text-gray-950 block mt-1.5">${Number(rel.price || 0).toFixed(2)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 font-bold focus:outline-none z-10 cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
          
          <button
            onClick={handleLightboxPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-gray-300 focus:outline-none cursor-pointer"
            aria-label="Previous image"
          >
            ‹
          </button>

          <div className="max-w-4xl max-h-[85vh] overflow-hidden flex items-center justify-center">
            <img
              src={galleryImages[lightboxIndex]}
              alt={`Fullscreen view ${lightboxIndex}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>

          <button
            onClick={handleLightboxNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-gray-300 focus:outline-none cursor-pointer"
            aria-label="Next image"
          >
            ›
          </button>

          <div className="absolute bottom-4 text-xs font-bold text-gray-400">
            Image {lightboxIndex + 1} of {galleryImages.length}
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Bar */}
      {variantStock > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-md">
          <button
            onClick={handleAddToCart}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-xs font-black text-white hover:bg-indigo-700 transition cursor-pointer"
          >
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 rounded-xl bg-amber-500 py-3 text-xs font-black text-gray-900 hover:bg-amber-600 transition cursor-pointer"
          >
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductDetailsPage;
