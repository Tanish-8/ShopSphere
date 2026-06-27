import { Link } from "react-router-dom";
import useCart from "../../hooks/useCart";
import { FALLBACK_PRODUCT_IMAGE } from "../../utils/productImage";

export default function ProductCard({ product, isWishlisted, onWishlistToggle }) {
  const { addItem } = useCart();

  const id = product._id || product.id;
  const name = product.name || "Untitled Product";
  const category = product.category || "General";
  const price = product.price || 0;
  const rating = Math.round(product.rating || 0);
  const numReviews = product.numReviews || 0;

  const image = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images[0]
    : product.image || FALLBACK_PRODUCT_IMAGE;

  // Mock discount
  const originalPrice = price * 1.25;
  const discountPercent = 20;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: id,
      name,
      image,
      price,
      countInStock: product.stock || 10
    }, 1);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md">
      {/* Discount Badge */}
      <span className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
        {discountPercent}% OFF
      </span>

      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onWishlistToggle(id);
        }}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs text-gray-500 shadow-sm transition hover:bg-white hover:text-red-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill={isWishlisted ? "#EF4444" : "none"}
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke={isWishlisted ? "#EF4444" : "currentColor"}
          className="h-5 w-5 transition duration-200"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </button>

      {/* Image Block */}
      <Link to={`/products/${id}`} className="block overflow-hidden bg-gray-50 aspect-square">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_PRODUCT_IMAGE;
          }}
        />
      </Link>

      {/* Body details */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {category}
        </span>

        {/* Name */}
        <Link
          to={`/products/${id}`}
          className="mt-1 line-clamp-2 text-sm font-semibold text-gray-800 hover:text-indigo-600"
        >
          {name}
        </Link>

        {/* Star rating */}
        <div className="mt-2 flex items-center gap-1">
          <div className="flex text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-xs">
                {i < rating ? "★" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-gray-500">({numReviews})</span>
        </div>

        {/* Price grid */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">${price.toFixed(2)}</span>
          <span className="text-xs text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
        </div>

        {/* Add to Cart button */}
        <button
          onClick={handleAddToCart}
          className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-indigo-700 active:scale-95"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
