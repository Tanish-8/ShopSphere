import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star,
  ShoppingBag,
  Heart,
  Check,
  Truck,
  ShieldCheck,
  ArrowLeft,
  Minus,
  Plus,
  Share2,
  RefreshCw,
  AlertCircle,
  MessageSquare
} from "lucide-react";
import { fetchProductById, fetchProductDetails, postProductReview } from "../services/productService";
import { addToWishlist, removeFromWishlist, fetchWishlist } from "../services/wishlistService";
import useCart from "../hooks/useCart";
import { useCurrency } from "../contexts/CurrencyContext";
import { useToast } from "../contexts/ToastContext";
import useAuth from "../hooks/useAuth";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { convertPrice, formatCurrency } = useCurrency();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProductDetails(id);
      if (!data) {
        // Fallback to fetchProductById
        const fallbackData = await fetchProductById(id);
        if (!fallbackData) throw new Error("Product not found");
        setProduct(fallbackData);
        setSelectedImage(fallbackData.image || (fallbackData.images && fallbackData.images[0]) || "");
      } else {
        setProduct(data);
        const mainImg = data.image || (Array.isArray(data.images) && data.images[0]) || "";
        setSelectedImage(mainImg);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkWishlistStatus = useCallback(async () => {
    if (!user) return;
    try {
      const wishlist = await fetchWishlist();
      const match = wishlist.some((item) => (item._id || item.id) === id);
      setIsWishlisted(match);
    } catch {
      // ignore
    }
  }, [id, user]);

  useEffect(() => {
    loadProduct();
    checkWishlistStatus();
  }, [loadProduct, checkWishlistStatus]);

  const handleQuantityChange = (val) => {
    const stock = product?.stock ?? product?.countInStock ?? 99;
    const newQty = Math.max(1, Math.min(val, stock));
    setQuantity(newQty);
  };

  const handleAddToCart = () => {
    if (!product) return;
    setAddingToCart(true);
    const itemToAdd = {
      productId: product._id || product.id,
      name: product.name || product.title,
      price: product.price,
      image: product.image || (product.images && product.images[0]) || "",
      stock: product.stock ?? product.countInStock ?? 0,
    };
    addItem(itemToAdd, quantity);
    toast?.success?.(`${product.name || "Item"} added to cart!`);
    setAddingToCart(false);
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast?.info?.("Please log in to manage your wishlist.");
      navigate("/login");
      return;
    }
    const productId = product._id || product.id;
    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);
        setIsWishlisted(false);
        toast?.success?.("Removed from wishlist");
      } else {
        await addToWishlist(productId);
        setIsWishlisted(true);
        toast?.success?.("Added to wishlist!");
      }
    } catch (err) {
      toast?.error?.(err?.response?.data?.message || "Failed to update wishlist");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast?.error?.("Please enter a review comment.");
      return;
    }
    setSubmittingReview(true);
    try {
      await postProductReview(id, { rating, comment });
      toast?.success?.("Review submitted successfully!");
      setComment("");
      loadProduct();
    } catch (err) {
      toast?.error?.(err?.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
          <span>Loading product details...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Product Not Found</h2>
        <p className="text-slate-600 mb-6 max-w-md">{error || "The product you are looking for does not exist or has been removed."}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image].filter(Boolean);
  const formattedPrice = formatCurrency(convertPrice(product.price || 0));
  const origPrice = product.originalPrice ? formatCurrency(convertPrice(product.originalPrice)) : null;
  const inStock = (product.stock ?? product.countInStock ?? 0) > 0;
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];

  return (
    <div className="space-y-12">
      {/* Navigation & Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-indigo-600">Products</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main product showcase section */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Images Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-center">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="h-full w-full object-contain transition-all duration-300 hover:scale-105"
              />
            ) : (
              <div className="text-slate-400 font-medium">No Image Available</div>
            )}
            {product.badge && (
              <span className="absolute top-4 left-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white uppercase tracking-wider shadow">
                {product.badge}
              </span>
            )}
          </div>

          {/* Thumbnail row */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 p-1 bg-white transition ${
                    selectedImage === img ? "border-indigo-600 ring-2 ring-indigo-600/20" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {product.category || "General"}
              </span>
              {product.brand && (
                <span className="text-xs font-medium text-slate-500">
                  Brand: <strong className="text-slate-800">{product.brand}</strong>
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              {product.name}
            </h1>

            {/* Ratings summary */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200 fill-slate-100"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {product.rating ? Number(product.rating).toFixed(1) : "0.0"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-sm text-slate-500">
                {reviews.length || product.numReviews || 0} reviews
              </span>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-4 pt-2">
              <span className="text-3xl font-extrabold text-slate-900">{formattedPrice}</span>
              {origPrice && (
                <span className="text-lg text-slate-400 line-through">{origPrice}</span>
              )}
              {product.discount > 0 && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {product.discount}% OFF
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-slate-600 leading-relaxed pt-2">
              {product.description || "No description available for this product."}
            </p>

            {/* Specifications if any */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Specifications</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs text-slate-400 capitalize">{key}</span>
                      <span className="font-medium text-slate-700">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Box */}
          <div className="border-t border-slate-200 pt-6 space-y-6">
            {/* Stock status */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`h-2.5 w-2.5 rounded-full ${inStock ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <span className={`font-semibold ${inStock ? "text-emerald-700" : "text-rose-600"}`}>
                {inStock ? `In Stock (${product.stock ?? product.countInStock} available)` : "Out of Stock"}
              </span>
            </div>

            {/* Quantity selector & buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-xl border border-slate-300 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={!inStock || quantity <= 1}
                  className="p-3 text-slate-500 hover:text-slate-700 disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold text-slate-800">{quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={!inStock}
                  className="p-3 text-slate-500 hover:text-slate-700 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>{addingToCart ? "Adding..." : "Add to Cart"}</span>
              </button>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`p-3.5 rounded-xl border transition ${
                  isWishlisted
                    ? "border-rose-300 bg-rose-50 text-rose-600"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-rose-600" : ""}`} />
              </button>
            </div>

            {/* Feature Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-600" />
                <span>Fast & Reliable Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>2 Year Extended Warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-slate-200 pt-10 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-indigo-600" />
            Customer Reviews ({reviews.length})
          </h2>
        </div>

        {/* Existing Reviews */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {reviews.length > 0 ? (
            reviews.map((rev, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{rev.name || rev.userName || "Verified Buyer"}</span>
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < (rev.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
                {rev.createdAt && (
                  <span className="text-xs text-slate-400 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm italic col-span-2">No reviews yet. Be the first to write a review!</p>
          )}
        </div>

        {/* Write a Review */}
        {user ? (
          <form onSubmit={handleSubmitReview} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 max-w-xl">
            <h3 className="text-lg font-bold text-slate-800">Write a Review</h3>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                  >
                    <Star className={`h-6 w-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Your Comment</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this product..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        ) : (
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-700 flex items-center justify-between">
            <span>Please log in to leave a review.</span>
            <Link to="/login" className="font-bold underline hover:text-indigo-900">Log In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
