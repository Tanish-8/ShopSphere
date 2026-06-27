import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";
import { fetchWishlist } from "../../services/wishlistService";

const navLinkClass = ({ isActive }) =>
  `transition-colors ${isActive ? "text-indigo-600" : "text-gray-700 hover:text-indigo-600"}`;

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItemCount } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [closeTimeoutId, setCloseTimeoutId] = useState(null);

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
    { label: "Coupons", to: "/profile", icon: (
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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="rounded-lg bg-indigo-600 px-2 py-1 text-sm font-bold text-white">SS</span>
              <span className="text-lg font-semibold text-gray-900">ShopSphere</span>
            </Link>

            <div className="hidden items-center gap-6 text-sm font-medium md:flex">
              <NavLink to="/" className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/products" className={navLinkClass}>
                Products
              </NavLink>
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-end gap-4 md:flex">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full rounded-full border border-gray-300 bg-gray-50 px-4 py-2 pl-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <svg
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400"
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
            </div>

            <Link
              to="/cart"
              className="relative rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600"
              aria-label="Cart"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 3h2l1.4 8.4a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 6H7" />
                <circle cx="10" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-semibold text-white">
                {totalItemCount}
              </span>
            </Link>

            <Link
              to="/wishlist"
              className="relative rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-indigo-600"
              aria-label="Wishlist"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8L12 22l8.8-9.6a5.5 5.5 0 000-7.8z" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-600 px-1 text-xs font-semibold text-white">
                {wishlistCount}
              </span>
            </Link>

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
                  className="flex items-center gap-3 rounded-full hover:bg-gray-50 p-1.5 transition outline-none cursor-pointer"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-sm ring-2 ring-white">
                    {initials}
                  </div>
                  <div className="hidden text-left text-xs lg:block">
                    <span className="block text-[10px] text-gray-400 font-medium leading-none">Hello,</span>
                    <span className="mt-1.5 font-semibold text-gray-800 flex items-center gap-1 leading-none">
                      {user?.name?.split(" ")[0]}
                      <svg
                        className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[250px] origin-top-right rounded-2xl border border-gray-150 bg-white p-2.5 shadow-lg focus:outline-none z-50 animate-dropdown">
                    {/* Header */}
                    <div className="flex items-center gap-3 p-1.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-extrabold text-white text-sm shadow-xs ring-2 ring-indigo-100">
                        {initials}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-bold text-gray-900 leading-tight">{user?.name}</p>
                        <p className="truncate text-[10px] text-gray-400 leading-normal">{user?.email}</p>
                        <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-700">
                          {user?.role === "admin" ? "Administrator" : "Customer"}
                        </span>
                      </div>
                    </div>

                    <hr className="my-2 border-gray-100" />

                    {/* Menu Items list */}
                    <div className="space-y-0.5">
                      {menuItems.map((item, index) =>
                        item.disabled ? (
                          <div
                            key={index}
                            className="flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed opacity-60 text-left"
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                        ) : (
                          <Link
                            key={index}
                            to={item.to}
                            onClick={() => setIsDropdownOpen(false)}
                            className="group flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 text-left"
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </Link>
                        )
                      )}
                    </div>

                    <hr className="my-2 border-gray-100" />

                    {/* Logout button */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 cursor-pointer"
                    >
                      <svg className="h-5 w-5 text-red-400 group-hover:text-red-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
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

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 transition hover:bg-gray-100 md:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="space-y-4 border-t border-gray-200 py-4 md:hidden">
            <div className="space-y-2 text-sm font-medium">
              <NavLink to="/" className="block text-gray-700 hover:text-indigo-600" onClick={() => setIsMenuOpen(false)}>
                Home
              </NavLink>
              <NavLink
                to="/products"
                className="block text-gray-700 hover:text-indigo-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </NavLink>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/cart"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
              >
                Cart
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-semibold text-white">
                  {totalItemCount}
                </span>
              </Link>
              {isAuthenticated ? (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-extrabold text-white text-sm shadow-xs ring-2 ring-indigo-100">
                      {initials}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-bold text-gray-900 leading-tight">{user?.name}</p>
                      <p className="truncate text-[10px] text-gray-400 leading-normal">{user?.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-700">
                        {user?.role === "admin" ? "Administrator" : "Customer"}
                      </span>
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
                        <Link
                          key={index}
                          to={item.to}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl border border-gray-150 p-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition"
                        >
                          {item.icon}
                          <span className="truncate">{item.label}</span>
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 cursor-pointer"
                  >
                    <svg className="h-4.5 w-4.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
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
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
