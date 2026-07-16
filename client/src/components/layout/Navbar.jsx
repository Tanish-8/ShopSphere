import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";
import { fetchWishlist } from "../../services/wishlistService";
import { fetchProducts } from "../../services/productService";
import { FALLBACK_PRODUCT_IMAGE } from "../../utils/productImage";
import AnimatedBadge from "../ui/AnimatedBadge";

const navLinkClass = ({ isActive }) =>
  `relative transition-colors ${isActive ? "text-indigo-600" : "text-gray-700 hover:text-indigo-600"}`;

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItemCount } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [closeTimeoutId, setCloseTimeoutId] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Scroll-based animations
  const { scrollY } = useScroll();
  const height = useTransform(scrollY, [0, 100], [64, 56]);
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']
  );
  const shadow = useTransform(
    scrollY,
    [0, 100],
    ['none', '0 4px 20px -5px rgba(0, 0, 0, 0.1)']
  );

  // Scroll detection for navbar effects
  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', updateScrolled);
    return () => window.removeEventListener('scroll', updateScrolled);
  }, []);

  // Debounced search logic for live suggestions
  useEffect(() => {
    if (searchQuery.trim().length <= 1) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await fetchProducts({ keyword: searchQuery, limit: 5 });
        setSuggestions(results || []);
      } catch (err) {
        console.error("Search suggestion error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setIsMenuOpen(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return undefined;
    const handleClose = (e) => {
      const el = document.getElementById("user-menu-wrapper");
      if (el && !el.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClose);
    return () => document.removeEventListener("mousedown", handleClose);
  }, [isDropdownOpen]);

  // Close dropdown on Escape key press
  useEffect(() => {
    if (!isDropdownOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutId) clearTimeout(closeTimeoutId);
    };
  }, [closeTimeoutId]);

  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      if (closeTimeoutId) {
        clearTimeout(closeTimeoutId);
        setCloseTimeoutId(null);
      }
      setIsDropdownOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      const id = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 180); // 150-200ms delay
      setCloseTimeoutId(id);
    }
  };

  const handleTriggerClick = () => {
    if (window.innerWidth < 768) {
      setIsDropdownOpen((prev) => !prev);
    }
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const menuItems = [
    { label: "My Profile", to: "/profile", icon: (
      <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ) },
    { label: "My Orders", to: "/orders", icon: (
      <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ) },
    { label: "Wishlist", to: "/wishlist", icon: (
      <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ) },
    { label: "Saved Addresses", to: "/addresses", icon: (
      <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) },
    { label: "Coupons", to: "/coupons", icon: (
      <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ) },
    { label: "Download Invoices", to: "/invoices", icon: (
      <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ) },
    { label: "Settings", to: "/settings", icon: (
      <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) },
    { label: "Help & Support", to: "/help", icon: (
      <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) }
  ];

  useEffect(() => {
    let mounted = true;

    const loadWishlistCount = async () => {
      if (!isAuthenticated) {
        if (mounted) setWishlistCount(0);
        return;
      }
      try {
        const list = await fetchWishlist();
        if (mounted) setWishlistCount(list.length);
      } catch (e) {
        // ignore
      }
    };

    loadWishlistCount();
    window.addEventListener("wishlist-updated", loadWishlistCount);

    return () => {
      mounted = false;
      window.removeEventListener("wishlist-updated", loadWishlistCount);
    };
  }, [isAuthenticated, location.pathname]);

  return (
    <motion.header
      style={{ height, backgroundColor, boxShadow: shadow }}
      className="sticky top-0 z-50 border-b border-transparent transition-all duration-300"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4" style={{ minHeight: height }}>
          <div className="flex items-center gap-8">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="relative w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl overflow-hidden shadow-lg">
                  <motion.div
                    animate={{
                      rotate: [0, 90, 180, 270, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 opacity-20"
                  />
                  <Sparkles className="text-white relative z-10" size={20} />
                </div>
                <span className="text-lg font-semibold bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 bg-clip-text text-transparent">
                  ShopSphere
                </span>
              </Link>
            </motion.div>

            <div className="hidden items-center gap-6 text-sm font-medium md:flex">
              <NavLink to="/" className={navLinkClass}>
                Home
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </NavLink>
              <NavLink to="/products" className={navLinkClass}>
                Products
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </NavLink>
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-end gap-4 md:flex">
            <div className="relative w-full max-w-sm">
              <form onSubmit={handleSearchSubmit}>
                <motion.div
                  className="relative flex items-center h-10 px-3 transition-all duration-300 ease-out rounded-full border border-black/5 bg-white/40 backdrop-blur-md"
                  animate={{ width: '100%' }}
                >
                  <button type="submit" className="mr-2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 3a6 6 0 104.472 10.001l3.263 3.264a1 1 0 001.414-1.414l-3.264-3.263A6 6 0 009 3zm-4 6a4 4 0 118 0 4 4 0 01-8 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search products..."
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-zinc-400"
                  />
                </motion.div>
              </form>

              {/* Suggestions overlay */}
              {showSuggestions && searchQuery.trim().length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-0 right-0 mt-2 rounded-2xl border border-black/5 bg-white/80 backdrop-blur-xl p-2.5 shadow-xl z-50 text-left space-y-1"
                >
                  {isSearching ? (
                    <div className="p-3 text-xs text-gray-500 text-center font-bold">Searching products...</div>
                  ) : suggestions.length === 0 ? (
                    <div className="p-3 text-xs text-gray-500 text-center font-bold">No products found</div>
                  ) : (
                    suggestions.map((item) => (
                      <Link
                        key={item._id || item.id}
                        to={`/products/${item._id || item.id}`}
                        onClick={() => {
                          setSearchQuery("");
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-3 rounded-xl p-2 hover:bg-black/5 transition border border-transparent hover:border-black/10"
                      >
                        <img
                          src={item.image || FALLBACK_PRODUCT_IMAGE}
                          alt={item.name}
                          className="h-9 w-9 rounded-lg object-cover bg-gray-50 shrink-0 border border-gray-100"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_PRODUCT_IMAGE;
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-gray-900 leading-tight">{item.name}</p>
                          <p className="text-[10px] font-bold text-indigo-650 mt-0.5">${item.price.toFixed(2)}</p>
                        </div>
                        <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 rounded px-2 py-0.5 uppercase tracking-wider shrink-0">
                          {item.category}
                        </span>
                      </Link>
                    ))
                  )}
                </motion.div>
              )}
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/cart"
                className="relative rounded-full p-2.5 text-gray-600 transition hover:bg-black/5 hover:text-zinc-900"
                aria-label="Cart"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 3h2l1.4 8.4a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 6H7" />
                  <circle cx="10" cy="20" r="1.5" />
                  <circle cx="18" cy="20" r="1.5" />
                </svg>
                <AnimatedBadge count={totalItemCount} color="indigo" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/wishlist"
                className="relative rounded-full p-2.5 text-gray-600 transition hover:bg-black/5 hover:text-red-500 hover:fill-red-500"
                aria-label="Wishlist"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8L12 22l8.8-9.6a5.5 5.5 0 000-7.8z" />
                </svg>
                <AnimatedBadge count={wishlistCount} color="pink" />
              </Link>
            </motion.div>

            {isAuthenticated ? (
              <div
                id="user-menu-wrapper"
                className="relative flex items-center h-full"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <style>{`
                  @keyframes dropdownFadeIn {
                    from {
                      opacity: 0;
                      transform: translateY(-4px) scale(0.98);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0) scale(1);
                    }
                  }
                  .animate-dropdown {
                    animation: dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                  }
                `}</style>

                <button
                  id="user-menu-button"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  onClick={handleTriggerClick}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-black/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px]">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white text-sm">
                        {initials}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-zinc-500 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-56 p-2 rounded-2xl border border-black/5 bg-white/80 backdrop-blur-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-black/5 mb-2">
                        <p className="text-sm font-semibold text-zinc-900">{user?.name}</p>
                        <p className="text-xs text-zinc-500">{user?.email}</p>
                      </div>

                      <div className="space-y-1">
                        {menuItems.map((item, index) =>
                          item.disabled ? (
                            <div
                              key={index}
                              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-gray-400 cursor-not-allowed opacity-60 text-left"
                            >
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                          ) : (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Link
                                to={item.to}
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all hover:bg-black/5 group text-zinc-600 hover:text-zinc-900"
                              >
                                {item.icon}
                                <span>{item.label}</span>
                              </Link>
                            </motion.div>
                          )
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-red-500 transition hover:bg-black/5 cursor-pointer"
                      >
                        <svg className="h-5 w-5 text-red-400 group-hover:text-red-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-600 transition hover:bg-black/5 md:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </motion.button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden"
              />

              {/* Mobile Menu */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-[101] shadow-2xl flex flex-col md:hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2">
                    <div className="relative w-8 h-8 flex items-center justify-center bg-zinc-900 rounded-lg overflow-hidden">
                      <motion.div
                        animate={{
                          rotate: [0, 90, 180, 270, 360],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 opacity-20"
                      />
                      <Sparkles className="text-white relative z-10" size={16} />
                    </div>
                    <span className="text-lg font-semibold bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 bg-clip-text text-transparent">
                      ShopSphere
                    </span>
                  </motion.div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 -mr-2 text-zinc-600 hover:text-zinc-900"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Mobile Search */}
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 bg-zinc-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Main Links */}
                  <nav className="space-y-1">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <NavLink
                        to="/"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors text-zinc-700 hover:bg-zinc-50"
                      >
                        Home
                        <ChevronRight size={18} className="text-zinc-400" />
                      </NavLink>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <NavLink
                        to="/products"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors text-zinc-700 hover:bg-zinc-50"
                      >
                        Products
                        <ChevronRight size={18} className="text-zinc-400" />
                      </NavLink>
                    </motion.div>
                  </nav>

                  <hr className="border-zinc-100" />

                  {/* Secondary Links */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Link
                        to="/wishlist"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 text-zinc-700 gap-2"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8L12 22l8.8-9.6a5.5 5.5 0 000-7.8z" />
                        </svg>
                        <span className="text-xs font-medium">Wishlist</span>
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Link
                        to="/cart"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 text-zinc-700 gap-2"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M3 3h2l1.4 8.4a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 6H7" />
                          <circle cx="10" cy="20" r="1.5" />
                          <circle cx="18" cy="20" r="1.5" />
                        </svg>
                        <span className="text-xs font-medium">Cart</span>
                      </Link>
                    </motion.div>
                  </div>

                  {isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-extrabold text-white text-sm shadow-xs ring-2 ring-indigo-100">
                          {initials}
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="truncate text-sm font-bold text-gray-900 leading-tight">{user?.name}</p>
                          <p className="truncate text-[10px] text-gray-400 leading-normal">{user?.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-700 text-left">
                        {menuItems.map((item, index) =>
                          item.disabled ? (
                            <div
                              key={index}
                              className="flex items-center gap-2 rounded-xl border border-gray-100 p-2 opacity-50 cursor-not-allowed bg-gray-50"
                            >
                              {item.icon}
                              <span className="truncate">{item.label.split(" (")[0]}</span>
                            </div>
                          ) : (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.25 + index * 0.05 }}
                            >
                              <Link
                                to={item.to}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-2 rounded-xl border border-gray-150 p-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition"
                              >
                                {item.icon}
                                <span className="truncate">{item.label}</span>
                              </Link>
                            </motion.div>
                          )
                        )}
                      </div>

                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        type="button"
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 cursor-pointer"
                      >
                        <svg className="h-4.5 w-4.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}

export default Navbar;
