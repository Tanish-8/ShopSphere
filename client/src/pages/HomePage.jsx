import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";
import { fetchProducts } from "../services/productService";
import { addToWishlist, removeFromWishlist, fetchWishlist } from "../services/wishlistService";
import ProductCard from "../components/product/ProductCard";
import { useToast } from "../contexts/ToastContext";
import Hero from "../components/hero/Hero";

const ProductCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-150 bg-white p-4 space-y-4 animate-pulse">
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
);

const features = [
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    title: "Fast Delivery",
    desc: "Free shipping on orders over $500. Under-day local packaging options."
  },
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Secure Payments",
    desc: "100% encrypted billing checkout and payment gateway integrations."
  },
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
      </svg>
    ),
    title: "Easy Returns",
    desc: "30-day money back guarantee with prompt collection options."
  },
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: "24/7 Support",
    desc: "Responsive support staff to assist your purchasing inquiries."
  }
];

export default function HomePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Dynamic products states
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Countdown timer for Flash Deals
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 19, seconds: 45 });

  // Newsletter state
  const [email, setEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    // Dynamic products fetching
    let mounted = true;
    (async () => {
      try {
        const featData = await fetchProducts({ featured: "true", limit: 4 });
        const featList = featData.length > 0 ? featData : (await fetchProducts({ limit: 4 }));
        
        const bestData = await fetchProducts({ sort: "popularity", limit: 4 });
        const flashData = await fetchProducts({ sort: "newest", limit: 4 });

        if (mounted) {
          setFeaturedProducts(featList);
          setBestSellers(bestData);
          setFlashDeals(flashData);
        }
      } catch (err) {
        console.error("Failed to load home products:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Wishlist loading if authenticated
    if (isAuthenticated) {
      (async () => {
        try {
          const list = await fetchWishlist();
          if (mounted) {
            setWishlistIds(list.map(p => p._id || p.id));
          }
        } catch (e) {
          // ignore
        }
      })();
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // Countdown interval control
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, []);

  const handleWishlistToggle = async (productId) => {
    if (!isAuthenticated) return navigate("/login");
    const prod = [...featuredProducts, ...bestSellers, ...flashDeals].find(
      (p) => (p._id || p.id) === productId
    );
    const prodName = prod ? prod.name : "Product";
    const toastId = toast.loading("Updating Wishlist...");

    try {
      const isWishlisted = wishlistIds.includes(productId);
      if (isWishlisted) {
        await removeFromWishlist(productId);
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
        toast.dismiss(toastId);
        toast.info("Removed from Wishlist", (
          <p className="font-bold text-gray-905">{prodName}</p>
        ));
      } else {
        await addToWishlist(productId);
        setWishlistIds((prev) => [...prev, productId]);
        toast.dismiss(toastId);
        toast.success("Added to Wishlist", (
          <div className="space-y-1">
            <p className="font-extrabold text-gray-900 leading-tight">{prodName}</p>
            <div className="flex gap-2.5 pt-1 text-[10px] font-black text-indigo-650">
              <a href="/wishlist" className="hover:underline">View Wishlist</a>
              <span className="text-gray-300">|</span>
              <a href="/products" className="hover:underline">Continue Shopping</a>
            </div>
          </div>
        ));
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Something went wrong.", "Please try again.");
      console.error("Failed to update wishlist:", err);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setNewsletterSubscribed(true);
    setEmail("");
    setTimeout(() => setNewsletterSubscribed(false), 3000);
  };

  return (
    <div className="space-y-16">
      {/* 1. New Premium Hero Section */}
      <Hero />

      {/* 2. Why Shop With Us Section */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feat, i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-gray-150 bg-white p-5 shadow-xs">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              {feat.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{feat.title}</h3>
              <p className="mt-1 text-xs text-gray-500 leading-normal">{feat.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Shop by Category Section */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Shop by Category</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              name: "Electronics",
              count: "120+ items",
              bg: "from-blue-500 to-indigo-600",
              icon: (
                <svg className="absolute bottom-[-15px] right-[-15px] w-28 h-28 text-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/>
                </svg>
              )
            },
            {
              name: "Fashion",
              count: "80+ items",
              bg: "from-pink-500 to-rose-600",
              icon: (
                <svg className="absolute bottom-[-15px] right-[-15px] w-28 h-28 text-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c1.1 0 2 .9 2 2H10c0-1.1.9-2 2-2zm6.6 6.3L12 3.6 5.4 8.3c-.6.4-.9 1.1-.9 1.8V20c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V10.1c0-.7-.3-1.4-.9-1.8z"/>
                </svg>
              )
            },
            {
              name: "Home & Living",
              count: "95+ items",
              bg: "from-amber-500 to-orange-600",
              icon: (
                <svg className="absolute bottom-[-15px] right-[-15px] w-28 h-28 text-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 10H5c-1.66 0-3 1.34-3 3v5h2v-2h16v2h2v-5c0-1.66-1.34-3-3-3zm-7-5c-2.76 0-5 2.24-5 5h10c0-2.76-2.24-5-5-5z"/>
                </svg>
              )
            },
            {
              name: "Beauty",
              count: "60+ items",
              bg: "from-emerald-500 to-teal-600",
              icon: (
                <svg className="absolute bottom-[-15px] right-[-15px] w-28 h-28 text-white/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
              )
            }
          ].map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              className="group relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-r p-5 text-white shadow-xs transition-all duration-300 hover:scale-103 hover:shadow-md"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} opacity-90 transition-opacity duration-300 group-hover:opacity-100`} />
              {cat.icon}
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{cat.name}</h3>
                  <p className="text-xs text-white/80">{cat.count}</p>
                </div>
                <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">
                  &#8594;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Flash Deals Section */}
      <section className="overflow-hidden rounded-3xl border border-red-200 bg-red-50 p-6 sm:p-8 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
            <span className="animate-pulse rounded-full h-2.5 w-2.5 bg-red-600"></span>
            FLASH DEALS
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
            Special Discounts • Limited Quantities
          </h2>
          <p className="text-sm text-gray-600">
            Hurry up! Grab top-tier products at unprecedented prices before the clock runs down.
          </p>
          <div className="flex justify-center lg:justify-start items-center gap-3 pt-2">
            <div className="flex flex-col items-center rounded-xl bg-white border border-red-100 p-3 shadow-sm min-w-16">
              <span className="text-xl font-black text-red-600 tracking-tight">{timeLeft.hours.toString().padStart(2, "0")}</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-450 mt-0.5">Hours</span>
            </div>
            <span className="text-xl font-black text-red-500 animate-pulse">:</span>
            <div className="flex flex-col items-center rounded-xl bg-white border border-red-100 p-3 shadow-sm min-w-16">
              <span className="text-xl font-black text-red-600 tracking-tight">{timeLeft.minutes.toString().padStart(2, "0")}</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-450 mt-0.5">Mins</span>
            </div>
            <span className="text-xl font-black text-red-500 animate-pulse">:</span>
            <div className="flex flex-col items-center rounded-xl bg-white border border-red-100 p-3 shadow-sm min-w-16">
              <span className="text-xl font-black text-red-600 tracking-tight">{timeLeft.seconds.toString().padStart(2, "0")}</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-450 mt-0.5">Secs</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-3/5 grid gap-4 sm:grid-cols-2">
          {loading ? (
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          ) : flashDeals.slice(0, 2).map((prod) => (
            <ProductCard
              key={prod._id}
              product={prod}
              isWishlisted={wishlistIds.includes(prod._id || prod.id)}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </div>
      </section>

      {/* 5. Featured Products Section */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-xs text-gray-500 mt-1">Our curated selection of top-performing items.</p>
          </div>
          <Link to="/products?featured=true" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">
            View All &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                isWishlisted={wishlistIds.includes(product._id || product.id)}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. Best Sellers Section */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-end justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Best Sellers</h2>
            <p className="text-xs text-gray-500 mt-1">The most popular items across our catalog.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                isWishlisted={wishlistIds.includes(product._id || product.id)}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        )}
      </section>

      {/* 7. Newsletter Section */}
      <section className="relative overflow-hidden rounded-3xl bg-indigo-900 px-6 py-12 text-white sm:px-12 sm:py-16 shadow-lg">
        {/* Decorative Circles */}
        <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-xs text-2xl">
            📬
          </div>
          <h2 className="text-2xl font-extrabold sm:text-4xl">Get Exclusive Offers</h2>
          <p className="text-sm text-indigo-200 max-w-md mx-auto">
            Subscribe to our weekly newsletter and never miss custom coupons, seasonal arrivals, and flash sales.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-sm text-white placeholder-indigo-300 outline-none transition focus:bg-white/20 focus:ring-2 focus:ring-white/30"
              required
            />
            <button
              type="submit"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 active:scale-95 cursor-pointer"
            >
              Subscribe
            </button>
          </form>

          {newsletterSubscribed && (
            <p className="text-xs text-emerald-300 font-semibold animate-fade-in">
              🎉 Thank you for subscribing! A confirmation details note is on its way.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
