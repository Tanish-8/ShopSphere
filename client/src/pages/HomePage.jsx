import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";
import { fetchProducts } from "../services/productService";
import { addToWishlist, removeFromWishlist, fetchWishlist } from "../services/wishlistService";
import ProductCard from "../components/product/ProductCard";
import { useToast } from "../contexts/ToastContext";
import Hero from "../components/hero/Hero";
import CategorySection from "../components/categories/CategorySection";
import { FeaturedSection, FeaturedProductCard, AnimatedProductGrid, ProductSkeleton } from "../components/featured";
import { CATEGORIES_HASH, scrollToCategoriesSection } from "../utils/scrollToCategories";

const ProductCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 space-y-4 animate-pulse">
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

// Legacy skeleton for backward compatibility
const LegacyProductCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 space-y-4 animate-pulse">
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
  const location = useLocation();
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
    if (location.pathname === "/" && location.hash === CATEGORIES_HASH) {
      scrollToCategoriesSection();
    }
  }, [location.pathname, location.hash]);

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

  // Handle scroll to flash deals when navigated from other pages
  useEffect(() => {
    if (location.state?.scrollToFlashDeals) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        const flashDealsSection = document.getElementById('flash-deals');
        if (flashDealsSection) {
          flashDealsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

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
          <div key={i} className="flex gap-4 rounded-2xl border border-[#E8E1D8] dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              {feat.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{feat.title}</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-normal">{feat.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Shop by Category Section */}
      <CategorySection />

      {/* 4. Flash Deals Section */}
      <section id="flash-deals" className="overflow-hidden rounded-3xl border border-[#FDE8E0] dark:border-gray-800 bg-[#FFF7F3] dark:bg-[#1e1b2e] p-6 sm:p-8 flex flex-col lg:flex-row items-center gap-8 shadow-sm">
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 dark:bg-rose-950/40 px-3.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-400">
            <span className="animate-pulse rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            FLASH DEALS
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Special Discounts • Limited Quantities
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hurry up! Grab top-tier products at unprecedented prices before the clock runs down.
          </p>
          <div className="flex justify-center lg:justify-start items-center gap-3 pt-2">
            <div className="flex flex-col items-center rounded-xl bg-white dark:bg-gray-800 border border-[#FDE8E0] dark:border-gray-700 p-3 shadow-sm min-w-16">
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{timeLeft.hours.toString().padStart(2, "0")}</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">Hours</span>
            </div>
            <span className="text-xl font-black text-rose-500 animate-pulse">:</span>
            <div className="flex flex-col items-center rounded-xl bg-white dark:bg-gray-800 border border-[#FDE8E0] dark:border-gray-700 p-3 shadow-sm min-w-16">
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{timeLeft.minutes.toString().padStart(2, "0")}</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">Mins</span>
            </div>
            <span className="text-xl font-black text-rose-500 animate-pulse">:</span>
            <div className="flex flex-col items-center rounded-xl bg-white dark:bg-gray-800 border border-[#FDE8E0] dark:border-gray-700 p-3 shadow-sm min-w-16">
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{timeLeft.seconds.toString().padStart(2, "0")}</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">Secs</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-3/5 grid gap-4 sm:grid-cols-2">
          {loading ? (
            <>
              <LegacyProductCardSkeleton />
              <LegacyProductCardSkeleton />
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

      {/* 5. Featured Products Section - Arena Design */}
      <FeaturedSection
        title="Featured Products"
        subtitle="Handpicked products selected for you. Discover our latest innovations and timeless classics."
        badge="Curated Collection"
        showViewAll={true}
        viewAllText="View All Products"
        onViewAllClick={() => navigate('/products?featured=true')}
      >
        {loading ? (
          <AnimatedProductGrid>
            {[...Array(4)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </AnimatedProductGrid>
        ) : (
          <AnimatedProductGrid columns={4}>
            {featuredProducts.map((product) => (
              <FeaturedProductCard
                key={product._id || product.id}
                product={product}
                isWishlisted={wishlistIds.includes(product._id || product.id)}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </AnimatedProductGrid>
        )}
      </FeaturedSection>

      {/* 6. Best Sellers Section */}
      <section className="rounded-3xl border border-[#E8E1D8] dark:border-gray-800 bg-[#F3EFE8] dark:bg-[#0f172a] p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-end justify-between border-b border-[#E8E1D8] dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Best Sellers</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">The most popular items across our catalog.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <LegacyProductCardSkeleton />
            <LegacyProductCardSkeleton />
            <LegacyProductCardSkeleton />
            <LegacyProductCardSkeleton />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
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
      <section className="relative overflow-hidden rounded-3xl bg-indigo-900 dark:bg-indigo-950/90 border border-indigo-800/50 px-6 py-12 text-white sm:px-12 sm:py-16 shadow-md">
        {/* Decorative Circles */}
        <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-2xl">
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
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 active:scale-95 cursor-pointer shadow-sm"
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
