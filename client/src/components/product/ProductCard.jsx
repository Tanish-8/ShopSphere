import { useState } from "react";
import { Link } from "react-router-dom";
import useCart from "../../hooks/useCart";
import { FALLBACK_PRODUCT_IMAGE } from "../../utils/productImage";

export default function ProductCard({ product, isWishlisted, onWishlistToggle }) {
  const { addItem } = useCart();
  const [compared, setCompared] = useState(false);

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

  const handleCompareToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCompared(!compared);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300">
      {/* Product Badges (Top Left) */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 items-start">
        {badge && (
          <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs">
            {badge}
          </span>
        )}
        {discount > 0 && (
          <span className="rounded-md bg-rose-500 px-2 py-0.5 text-xs font-semibold tracking-wider text-white shadow-xs">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Wishlist Button (Top Right) */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onWishlistToggle(id);
        }}
        className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 backdrop-blur-xs shadow-xs transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${isWishlisted ? "text-rose-500 bg-rose-50/80" : "text-gray-400 hover:text-rose-500"}`}
        aria-label="Toggle Wishlist"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill={isWishlisted ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5 transition duration-200"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </button>

      {/* Compare Button (Floating Below Wishlist) */}
      <button
        onClick={handleCompareToggle}
        className={`absolute right-3 top-[56px] z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-xs transition-all duration-300 hover:scale-105 hover:rotate-12 active:scale-95 cursor-pointer ${compared ? "bg-indigo-600 text-white shadow-indigo-100" : "bg-white/95 backdrop-blur-xs text-gray-400 hover:text-indigo-650"}`}
        title={compared ? "Compared" : "Compare Product"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.2}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0-4.5 4.5M21 7.5H7.5"
          />
        </svg>
      </button>

      {/* Image Block with Zoom on Hover */}
      <Link to={`/products/${id}`} className="block overflow-hidden bg-gray-50 aspect-square relative">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_PRODUCT_IMAGE;
          }}
        />
        
        {/* Out of Stock Overlay */}
        {stock === 0 && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex items-center justify-center">
            <span className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Body details */}
      <div className="flex flex-1 flex-col p-4 text-left space-y-3">
        {/* Brand & Category */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
            {brand}
          </span>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
            {category}
          </span>
        </div>

        {/* Name */}
        <Link
          to={`/products/${id}`}
          className="mt-1 line-clamp-2 text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors leading-snug"
        >
          {name}
        </Link>

        {/* Star rating & Reviews count */}
        <div className="mt-1 flex items-center gap-1">
          <div className="flex text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-xs">
                {i < rating ? "â˜…" : "â˜†"}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500 font-medium select-none">
            ({numReviews.toLocaleString()})
          </span>
        </div>

        {/* Price grid & Stock warning */}
        <div className="mt-2 flex items-baseline justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-gray-900">${price.toFixed(2)}</span>
            {discount > 0 && (
              <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
            )}
          </div>
          
          {/* Stock Indicator */}
          {stock > 0 && stock <= 5 && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5 animate-pulse">
              Only {stock} Left
            </span>
          )}
          {stock > 5 && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
              In Stock
            </span>
          )}
        </div>

        {/* Add to Cart button */}
        <button
          onClick={handleAddToCart}
          disabled={stock === 0}
          className={`mt-auto w-full rounded-lg py-3 text-xs font-bold text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs ${stock === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
          {stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
