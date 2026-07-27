import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWishlist, removeFromWishlist } from "../services/wishlistService";
import ProductCard from "../components/product/ProductCard";
import { useToast } from "../contexts/ToastContext";

const WishlistSkeleton = () => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 space-y-4 animate-pulse">
        <div className="aspect-square w-full rounded-xl bg-gray-100"></div>
        <div className="space-y-2">
          <div className="h-3 w-1/3 rounded bg-gray-200"></div>
          <div className="h-5 w-3/4 rounded bg-gray-200"></div>
          <div className="h-3.5 w-1/2 rounded bg-gray-200"></div>
        </div>
        <div className="flex justify-between items-center pt-2 gap-4">
          <div className="h-6 w-1/3 rounded bg-gray-200"></div>
          <div className="h-8 w-1/3 rounded-xl bg-gray-200"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function WishlistPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchWishlist();
      setItems(list);
    } catch (e) {
      console.error("Wishlist load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (id) => {
    const item = items.find((i) => (i._id || i.id) === id);
    const prodName = item ? item.name : "Product";
    const toastId = toast.loading("Updating Wishlist...");
    try {
      await removeFromWishlist(id);
      toast.dismiss(toastId);
      toast.info("Removed from Wishlist", (
        <p className="font-bold text-gray-900">{prodName}</p>
      ));
      // Dispatch event to update navbar count
      window.dispatchEvent(new Event("wishlist-updated"));
      load();
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Something went wrong.", "Please try again.");
    }
  };

  return (
    <div className="space-y-8 animate-dropdown text-left">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Wishlist</h1>
        <p className="mt-2 text-sm text-gray-600">Saved items you want to keep an eye on.</p>
      </header>

      {loading ? (
        <WishlistSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <div className="text-5xl">❤️</div>
          <h2 className="text-lg font-bold text-gray-800">Your wishlist is empty</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            Tap the heart icon on any product to save it here, making it easier to find and purchase later!
          </p>
          <Link
            to="/products"
            className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-xs font-extrabold text-white transition-all duration-300 hover:bg-indigo-700 active:scale-95 shadow-sm cursor-pointer"
          >
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
          {items.map((p) => (
            <ProductCard
              key={p._id || p.id}
              product={p}
              isWishlisted={true}
              onWishlistToggle={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
