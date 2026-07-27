import { Link } from "react-router-dom";
import useCart from "../../hooks/useCart";
import { useCurrency } from "../../contexts/CurrencyContext";
import { FALLBACK_PRODUCT_IMAGE } from "../../utils/productImage";
import { useToast } from "../../contexts/ToastContext";
import { Heart, Share2, ShoppingCart, Star } from "lucide-react";

export default function ProductCard({ product, isWishlisted, onWishlistToggle, className = "" }) {
  const { addItem } = useCart();
  const toast = useToast();
  const { convertPrice, formatCurrency } = useCurrency();
  const id = product._id || product.id;
  const name = product.name || "Untitled Product";
  const category = product.category || "General";
  const price = product.price || 0;
  const originalPrice = product.originalPrice || price;
  const discount = product.discount || 0;
  const rating = Math.round(product.rating || 0);
  const numReviews = product.numReviews || 0;
  const badge = product.badge || "";
  const stock = product.stock ?? 0;
  const brand = product.brand || "Unbranded";

  const image = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images[0]
    : product.image || FALLBACK_PRODUCT_IMAGE;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock === 0) return;
    addItem({
      productId: id,
      name,
      image,
      price,
      countInStock: stock
    }, 1);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
  
    const url = `${window.location.origin}/products/${id}`;
  
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Product link copied!");
    } catch {
      toast.error("Failed to copy product link.");
    }
  };

  return (
    <div className={`group relative flex flex-col h-full overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-[6px] dark:bg-gray-800 ${className}`}>
      {/* Product Badges (Top Left) */}
      {badge && (
        <span className="absolute left-3 top-3 z-10 rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
          {badge}
        </span>
      )}
      {discount > 0 && (
        <span className="absolute left-3 top-[28px] z-10 rounded-md bg-rose-500 px-2 py-0.5 text-xs font-semibold tracking-wider text-white shadow-sm">
          {discount}% OFF
        </span>
      )}

      {/* Wishlist Button (Top Right) */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onWishlistToggle(id);
        }}
        className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-white/70 shadow-lg transition-all duration-300 hover:scale-105 ${
          isWishlisted
            ? "text-rose-600"
            : "text-gray-600 hover:text-rose-600"
        }`}
        aria-label="Toggle Wishlist"
      >
        <Heart
          className="h-5 w-5 transition-colors duration-200"
          fill={isWishlisted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
        />
      </button>

      {/* Share Button (Floating Below Wishlist) */}
      <button
        onClick={handleShare}
        className="absolute right-3 top-[56px] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-white/70 shadow-lg text-gray-600 transition-all duration-300 hover:scale-105 hover:text-indigo-600 hover:bg-white"
        title="Share Product"
      >
        <Share2
          className="h-5 w-5"
          strokeWidth={2}
        />
      </button>

      {/* Image Block with Zoom on Hover - Fixed Aspect Ratio */}
      <Link to={`/products/${id}`} className="block overflow-hidden bg-gray-50 aspect-square relative w-full shrink-0">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover rounded-t-[18px] transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_PRODUCT_IMAGE;
          }}
        />
        {stock === 0 && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center dark:bg-black/75 dark:backdrop-blur-sm">
            <span className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Body details - Flex container with mt-auto button anchoring */}
      <div className="flex flex-1 flex-col p-4 text-left">
        {/* Fixed Height: Brand & Category */}
        <div className="flex h-5 items-center justify-between gap-2 shrink-0">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 truncate max-w-[55%]">
            {brand}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[45%] text-right">
            {category}
          </span>
        </div>

        {/* Fixed Height: Product Title (Exactly 2 lines clamped) */}
        <div className="mt-2 h-11 shrink-0">
          <Link
            to={`/products/${id}`}
            className="line-clamp-2 text-sm sm:text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors leading-snug dark:text-gray-100 dark:hover:text-indigo-300"
            title={name}
          >
            {name}
          </Link>
        </div>

        {/* Fixed Height: Star Rating & Reviews */}
        <div className="mt-2 h-5 flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                fill={i < rating ? "currentColor" : "none"}
                className={i < rating ? "text-amber-400" : "text-gray-300"}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 font-medium select-none dark:text-gray-400">
            ({numReviews.toLocaleString()})
          </span>
        </div>

        {/* Fixed Height: Price & Stock Status (Reserved Badge Slot) */}
        <div className="mt-3 flex h-7 items-center justify-between gap-2 shrink-0">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {formatCurrency(convertPrice(price))}
            </span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through dark:text-gray-500 truncate">
                {formatCurrency(convertPrice(originalPrice))}
              </span>
            )}
          </div>
          {/* Reserved Stock Badge Height */}
          <div className="flex items-center h-6 shrink-0">
            {stock > 0 && stock <= 5 && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5 animate-pulse dark:bg-amber-900/20 dark:text-amber-300 whitespace-nowrap">
                Only {stock} Left
              </span>
            )}
            {stock > 5 && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 dark:bg-emerald-900/20 dark:text-emerald-300 whitespace-nowrap">
                In Stock
              </span>
            )}
            {stock === 0 && (
              <span className="text-xs font-semibold text-red-700 bg-red-50 rounded-full px-2 py-0.5 dark:bg-red-900/20 dark:text-red-300 whitespace-nowrap">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button (Bottom Aligned via mt-auto) */}
        <button
          onClick={handleAddToCart}
          disabled={stock === 0}
          className={`mt-auto w-full h-11 shrink-0 rounded-lg flex items-center justify-center gap-2 text-sm font-bold text-white transition-all duration-300 active:scale-95 shadow-sm ${
            stock === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300"
              : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md dark:bg-indigo-500 dark:hover:bg-indigo-600"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          {stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}



