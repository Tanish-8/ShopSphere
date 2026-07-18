import { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  ShoppingCart,
  Heart,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";
import useTheme from "../../hooks/useTheme";
import { fetchWishlist } from "../../services/wishlistService";
import { fetchProducts } from "../../services/productService";
import { FALLBACK_PRODUCT_IMAGE } from "../../utils/productImage";
import { cn } from "../../utils/cn";
import { CATEGORIES_HASH, scrollToCategoriesSection } from "../../utils/scrollToCategories";
import AnimatedBadge from "../ui/AnimatedBadge";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Categories", scrollToCategories: true },
];

const ICON_BTN =
  "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white";

const navLinkClass = ({ isActive }) =>
  cn(
    "group relative whitespace-nowrap px-1 py-2 text-sm font-medium transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:rounded-md",
    isActive
      ? "text-indigo-600 dark:text-indigo-400"
      : "text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
  );

function NavbarIconButton({ to, onClick, ariaLabel, children, className }) {
  const inner = (
    <motion.span
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={cn(ICON_BTN, className)}
    >
      {children}
    </motion.span>
  );

  if (to) {
    return (
      <Link to={to} aria-label={ariaLabel} className="inline-flex">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="inline-flex">
      {inner}
    </button>
  );
}

function CategoriesNavLink({ isActive, onNavigate, className, children }) {
  return (
    <a
      href={`/${CATEGORIES_HASH}`}
      onClick={onNavigate}
      className={className}
      aria-current={isActive ? "location" : undefined}
    >
      {children}
    </a>
  );
}

function NavbarSearchForm({
  searchQuery,
  setSearchQuery,
  onSubmit,
  onFocus,
  onBlur,
  suggestions,
  isSearching,
  showSuggestions,
  setShowSuggestions,
  setSearchQueryClear,
  idPrefix = "navbar",
  className,
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={onSubmit} role="search">
        <motion.div
          layout
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "relative flex h-11 w-full items-center overflow-hidden rounded-full border transition-all duration-300",
            "bg-gray-100/90 dark:bg-gray-800/90",
            isFocused
              ? "border-indigo-400/60 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20 dark:border-indigo-500/40"
              : "border-gray-200/70 dark:border-gray-700/70 hover:border-gray-300 dark:hover:border-gray-600"
          )}
        >
          <button
            type="submit"
            className="absolute left-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:hover:bg-gray-700/60 dark:hover:text-gray-200"
            aria-label="Submit search"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
          </button>
          <input
            id={`${idPrefix}-search`}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search for products, brands and more"
            autoComplete="off"
            aria-label="Search for products, brands and more"
            aria-controls={`${idPrefix}-search-suggestions`}
            aria-expanded={showSuggestions && searchQuery.trim().length > 1}
            className="h-full w-full bg-transparent pl-12 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </motion.div>
      </form>

      <AnimatePresence>
        {showSuggestions && searchQuery.trim().length > 1 && (
          <motion.div
            id={`${idPrefix}-search-suggestions`}
            role="listbox"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-gray-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-gray-700/80 dark:bg-gray-900/95"
          >
            {isSearching ? (
              <p className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                Searching products...
              </p>
            ) : suggestions.length === 0 ? (
              <p className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                No products found
              </p>
            ) : (
              suggestions.map((item) => (
                <Link
                  key={item._id || item.id}
                  role="option"
                  to={`/products/${item._id || item.id}`}
                  onClick={() => {
                    setSearchQueryClear?.("");
                    setShowSuggestions(false);
                  }}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <img
                    src={item.image || FALLBACK_PRODUCT_IMAGE}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg border border-gray-100 object-cover dark:border-gray-700"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_PRODUCT_IMAGE;
                    }}
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </p>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {item.category}
                  </span>
                </Link>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItemCount } = useCart();
  const { theme, setTheme } = useTheme();
  const [wishlistCount, setWishlistCount] = useState(0);
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { scrollY } = useScroll();
  const height = useTransform(scrollY, [0, 100], [72, 64]);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const syncDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    syncDarkMode();

    const observer = new MutationObserver(syncDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(isDarkMode ? "light" : "dark");
  }, [isDarkMode, setTheme]);

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 12);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length <= 1) {
      setSuggestions([]);
      return undefined;
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

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setShowSuggestions(false);
  }, [location.pathname]);

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

  useEffect(
    () => () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    },
    []
  );

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
      } catch {
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setIsMenuOpen(false);
    }
  };

  const handleCategoriesNavigate = useCallback(
    (event) => {
      event.preventDefault();

      const closingMobileMenu = isMenuOpen;
      setIsMenuOpen(false);

      const goToCategories = () => {
        if (location.pathname === "/") {
          if (location.hash !== CATEGORIES_HASH) {
            navigate({ pathname: "/", hash: CATEGORIES_HASH });
          }
          scrollToCategoriesSection();
          return;
        }

        navigate({ pathname: "/", hash: CATEGORIES_HASH });
      };

      if (closingMobileMenu) {
        window.setTimeout(goToCategories, 320);
      } else {
        goToCategories();
      }
    },
    [isMenuOpen, location.pathname, location.hash, navigate]
  );

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      clearCloseTimeout();
      setIsDropdownOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 180);
    }
  };

  const handleTriggerClick = () => {
    if (window.innerWidth < 768) {
      setIsDropdownOpen((prev) => !prev);
    } else {
      setIsDropdownOpen((prev) => !prev);
    }
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const menuItems = [
    {
      label: "My Profile",
      to: "/profile",
      icon: (
        <svg className="h-5 w-5 text-gray-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: "My Orders",
      to: "/orders",
      icon: (
        <svg className="h-5 w-5 text-gray-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: "Wishlist",
      to: "/wishlist",
      icon: (
        <svg className="h-5 w-5 text-gray-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      label: "Saved Addresses",
      to: "/addresses",
      icon: (
        <svg className="h-5 w-5 text-gray-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Coupons",
      to: "/coupons",
      icon: (
        <svg className="h-5 w-5 text-gray-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      label: "Download Invoices",
      to: "/invoices",
      icon: (
        <svg className="h-5 w-5 text-gray-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Settings",
      to: "/settings",
      icon: (
        <svg className="h-5 w-5 text-gray-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Help & Support",
      to: "/help",
      icon: (
        <svg className="h-5 w-5 text-gray-400 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const isCategoriesActive =
    location.pathname === "/" && location.hash === CATEGORIES_HASH;

  return (
    <motion.header
      style={{ height }}
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl backdrop-saturate-150 transition-all duration-300",
        isScrolled
          ? "border-gray-200/70 bg-white/85 shadow-sm shadow-gray-900/5 dark:border-gray-800/80 dark:bg-gray-950/85 dark:shadow-black/25"
          : "border-transparent bg-white/75 dark:bg-gray-950/75"
      )}
    >
      <nav
        className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Brand + desktop nav */}
        <div className="flex min-w-0 shrink-0 items-center gap-6 lg:gap-8">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/"
              className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
              aria-label="ShopSphere home"
            >
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 shadow-lg ring-1 ring-black/5 transition-shadow group-hover:shadow-indigo-500/20 dark:ring-white/10">
                <motion.div
                  animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.15, 1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 opacity-25"
                />
                <Sparkles className="relative z-10 text-white" size={20} aria-hidden="true" />
              </div>
              <span className="hidden bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-lg font-semibold tracking-tight text-transparent dark:from-white dark:via-gray-200 dark:to-white sm:inline">
                ShopSphere
              </span>
            </Link>
          </motion.div>

          <div className="hidden items-center gap-5 md:flex lg:gap-6">
            {NAV_LINKS.map((link) =>
              link.scrollToCategories ? (
                <CategoriesNavLink
                  key={link.label}
                  isActive={isCategoriesActive}
                  onNavigate={handleCategoriesNavigate}
                  className={cn(navLinkClass({ isActive: isCategoriesActive }), "group")}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-indigo-600 transition-transform duration-300 group-hover:scale-x-100 dark:bg-indigo-400",
                      isCategoriesActive && "scale-x-100"
                    )}
                  />
                </CategoriesNavLink>
              ) : (
                <NavLink key={link.label} to={link.to} className={navLinkClass} end={link.to === "/"}>
                  {({ isActive }) => (
                    <>
                      {link.label}
                      <span
                        className={cn(
                          "absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-indigo-600 transition-transform duration-300 group-hover:scale-x-100 dark:bg-indigo-400",
                          isActive && "scale-x-100"
                        )}
                      />
                    </>
                  )}
                </NavLink>
              )
            )}
          </div>
        </div>

        {/* Centered search — tablet/desktop */}
        <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex lg:px-6">
          <NavbarSearchForm
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSubmit={handleSearchSubmit}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            suggestions={suggestions}
            isSearching={isSearching}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            setSearchQueryClear={setSearchQuery}
            className="w-full max-w-md lg:max-w-xl"
          />
        </div>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <NavbarIconButton to="/wishlist" ariaLabel={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`}>
              <Heart className="h-5 w-5 transition-colors hover:text-rose-500" strokeWidth={1.75} aria-hidden="true" />
              <AnimatedBadge count={wishlistCount} color="pink" />
            </NavbarIconButton>

            <NavbarIconButton to="/cart" ariaLabel={`Shopping cart${totalItemCount ? `, ${totalItemCount} items` : ""}`}>
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              <AnimatedBadge count={totalItemCount} color="indigo" />
            </NavbarIconButton>

            <NavbarIconButton
              onClick={toggleTheme}
              ariaLabel={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isDarkMode ? "moon" : "sun"}
                  initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 30, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex"
                >
                  {isDarkMode ? (
                    <Moon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Sun className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  )}
                </motion.span>
              </AnimatePresence>
            </NavbarIconButton>
          </div>

          <div className="mx-1 hidden h-6 w-px bg-gray-200 dark:bg-gray-700 md:block" aria-hidden="true" />

          {/* Profile / auth — desktop & tablet */}
          <div className="hidden md:block">
            {isAuthenticated ? (
              <div
                id="user-menu-wrapper"
                className="relative flex flex-col items-center"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  id="user-menu-button"
                  type="button"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="menu"
                  aria-controls="user-menu-dropdown"
                  aria-label="Account menu"
                  onClick={handleTriggerClick}
                  className="flex flex-col items-center gap-1 rounded-xl px-1 py-1 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:hover:bg-gray-800"
                >
                  <div className="rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-gray-900">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                        {initials}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "text-gray-400 transition-transform duration-300 dark:text-gray-500",
                      isDropdownOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      id="user-menu-dropdown"
                      role="menu"
                      aria-labelledby="user-menu-button"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-gray-700/80 dark:bg-gray-900/95"
                    >
                      <div className="mb-2 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                      </div>

                      <div className="space-y-0.5">
                        {menuItems.map((item, index) =>
                          item.disabled ? (
                            <div
                              key={index}
                              role="menuitem"
                              aria-disabled="true"
                              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 opacity-60"
                            >
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                          ) : (
                            <Link
                              key={index}
                              role="menuitem"
                              to={item.to}
                              onClick={() => setIsDropdownOpen(false)}
                              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                              {item.icon}
                              <span>{item.label}</span>
                            </Link>
                          )
                        )}
                      </div>

                      <div className="mt-1 border-t border-gray-100 pt-1 dark:border-gray-800">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/25 transition-all hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            className={cn(ICON_BTN, "md:hidden")}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-panel"
          >
            {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </motion.button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />

            <motion.div
              id="mobile-nav-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 right-0 z-[101] flex w-[min(100%,20rem)] flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 md:hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                  <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-zinc-900">
                    <Sparkles className="relative z-10 text-white" size={16} aria-hidden="true" />
                  </div>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">ShopSphere</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(ICON_BTN, "h-10 w-10")}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-4">
                <NavbarSearchForm
                  idPrefix="mobile"
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSubmit={handleSearchSubmit}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  suggestions={suggestions}
                  isSearching={isSearching}
                  showSuggestions={showSuggestions}
                  setShowSuggestions={setShowSuggestions}
                  setSearchQueryClear={setSearchQuery}
                />

                <nav className="space-y-1" aria-label="Mobile primary">
                  {NAV_LINKS.map((link, index) => (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {link.scrollToCategories ? (
                        <CategoriesNavLink
                          isActive={isCategoriesActive}
                          onNavigate={handleCategoriesNavigate}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                            isCategoriesActive
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                              : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                          )}
                        >
                          {link.label}
                          <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </CategoriesNavLink>
                      ) : (
                        <NavLink
                          to={link.to}
                          end={link.to === "/"}
                          onClick={() => setIsMenuOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            )
                          }
                        >
                          {link.label}
                          <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </NavLink>
                      )}
                    </motion.div>
                  ))}
                </nav>

                <hr className="border-gray-100 dark:border-gray-800" />

                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {menuItems.map((item, index) =>
                        item.disabled ? (
                          <div
                            key={index}
                            className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-400 opacity-60"
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                        ) : (
                          <Link
                            key={index}
                            to={item.to}
                            onClick={() => setIsMenuOpen(false)}
                            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </Link>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex-1 rounded-full border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex-1 rounded-full bg-indigo-600 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700"
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
    </motion.header>
  );
}

export default Navbar;
