import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";
import { fetchProducts } from "../services/productService";
import { addToWishlist, removeFromWishlist, fetchWishlist } from "../services/wishlistService";
import ProductCard from "../components/product/ProductCard";

const slides = [
  {
    headline: "Summer Fashion Sale",
    supporting: "Upgrade your wardrobe with up to 50% off on premium fashion brands.",
    bg: "from-indigo-600 to-purple-600",
    ctaText: "Shop Now",
    ctaLink: "/products?category=Fashion",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80"
  },
  {
    headline: "Next-Gen Electronics",
    supporting: "Discover the latest smartwatches, headphones, and mechanical keyboards.",
    bg: "from-violet-600 to-indigo-700",
    ctaText: "Explore Week",
    ctaLink: "/products?category=Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
  },
  {
    headline: "Minimalist Home Decor",
    supporting: "Transform your living space with our handcrafted furniture and plants.",
    bg: "from-purple-600 to-pink-600",
    ctaText: "View Decor",
    ctaLink: "/products?category=Home%20%26%20Living",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80"
  }
];

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
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Carousel Hero Section state
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselHovered, setCarouselHovered] = useState(false);

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

  // Slide interval control
  useEffect(() => {
    if (carouselHovered) return undefined;
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [carouselHovered]);

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
    const isWishlisted = wishlistIds.includes(productId);
    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
      } else {
        await addToWishlist(productId);
        setWishlistIds((prev) => [...prev, productId]);
      }
    } catch (err) {
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
      {/* 1. Carousel Hero Section */}
      <section
        onMouseEnter={() => setCarouselHovered(true)}
        onMouseLeave={() => setCarouselHovered(false)}
        className="relative overflow-hidden rounded-3xl bg-gray-900 shadow-xl"
      >
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`w-full shrink-0 bg-gradient-to-r ${slide.bg} px-6 py-12 text-white sm:px-12 sm:py-20 flex flex-col md:flex-row items-center gap-8`}
            >
              <div className="flex-1 space-y-5 text-center md:text-left">
                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  Limited Offer
                </span>
                <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
                  {slide.headline}
                </h1>
                <p className="max-w-xl text-sm text-indigo-100 sm:text-base leading-relaxed">
                  {slide.supporting}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 pt-2">
                  <Link
                    to={slide.ctaLink}
                    className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-indigo-700 shadow-md transition-all duration-300 hover:bg-indigo-50 hover:scale-105"
                  >
                    {slide.ctaText}
                  </Link>
                  <Link
                    to="/products?sort=priceLow"
                    className="rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    View Deals
                  </Link>
                </div>
              </div>

              <div className="relative w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 shrink-0">
                <img src={slide.image} alt={slide.headline} className="h-full w-full object-cover" />
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Prev/Next Buttons */}
        <button
          onClick={() => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white transition hover:bg-black/45 backdrop-blur-xs cursor-pointer z-20"
        >
          &#10094;
        </button>
        <button
          onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white transition hover:bg-black/45 backdrop-blur-xs cursor-pointer z-20"
        >
          &#10095;
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === i ? "w-6 bg-white" : "w-2.5 bg-white/50"}`}
            />
          ))}
        </div>
      </section>

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
            { name: "Electronics", count: "120+ items", bg: "from-blue-500 to-indigo-600" },
            { name: "Fashion", count: "80+ items", bg: "from-pink-500 to-rose-600" },
            { name: "Home & Living", count: "95+ items", bg: "from-amber-500 to-orange-600" },
            { name: "Beauty", count: "60+ items", bg: "from-emerald-500 to-teal-600" }
          ].map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              className="group relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-r p-5 text-white shadow-xs transition-all duration-300 hover:scale-103 hover:shadow-md"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} opacity-90 transition-opacity duration-300 group-hover:opacity-100`} />
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
            <div className="flex flex-col items-center rounded-xl bg-white border border-red-100 p-3 shadow-xs min-w-16">
              <span className="text-xl font-black text-red-600">{timeLeft.hours.toString().padStart(2, "0")}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hours</span>
            </div>
            <span className="text-xl font-bold text-red-500">:</span>
            <div className="flex flex-col items-center rounded-xl bg-white border border-red-100 p-3 shadow-xs min-w-16">
              <span className="text-xl font-black text-red-600">{timeLeft.minutes.toString().padStart(2, "0")}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mins</span>
            </div>
            <span className="text-xl font-bold text-red-500">:</span>
            <div className="flex flex-col items-center rounded-xl bg-white border border-red-100 p-3 shadow-xs min-w-16">
              <span className="text-xl font-black text-red-600">{timeLeft.seconds.toString().padStart(2, "0")}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Secs</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-3/5 grid gap-4 sm:grid-cols-2">
          {loading ? (
            <div className="py-6 text-center text-xs text-gray-500 col-span-2">Loading flash deals...</div>
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
          <div className="py-12 text-center text-sm text-gray-500">Loading featured products...</div>
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
          <div className="py-12 text-center text-sm text-gray-500">Loading best sellers...</div>
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
