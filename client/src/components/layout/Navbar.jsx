import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";

const navLinkClass = ({ isActive }) =>
  `transition-colors ${isActive ? "text-indigo-600" : "text-gray-700 hover:text-indigo-600"}`;

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItemCount } = useCart();

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

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm font-medium text-gray-700 lg:inline">Hi, {user?.name?.split(" ")[0] || "User"}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Logout
                </button>
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
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700"
                >
                  Logout
                </button>
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
