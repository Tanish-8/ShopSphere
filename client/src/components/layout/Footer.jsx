import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-5 lg:px-8">
        <section className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900">About ShopSphere</h3>
          <p className="mt-4 max-w-md text-sm leading-6 text-gray-600">
            ShopSphere is your modern ecommerce destination for quality products, smooth shopping, and fast checkout.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a href="#" className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600" aria-label="Instagram">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5a4.25 4.25 0 004.25 4.25h8.5a4.25 4.25 0 004.25-4.25v-8.5a4.25 4.25 0 00-4.25-4.25h-8.5z" />
                <path d="M12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.25-.95a1.05 1.05 0 11-2.1 0 1.05 1.05 0 012.1 0z" />
              </svg>
            </a>
            <a href="#" className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600" aria-label="Facebook">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H8v3h2.4v8h3.1z" />
              </svg>
            </a>
            <a href="#" className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600" aria-label="Twitter">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.9 7.2c.8-.1 1.5-.5 2.1-1-.3.9-1 1.6-1.8 2 .8 4.9-2.6 10.2-9.4 10.2-1.9 0-3.6-.5-5-1.5 1.8.2 3.6-.3 5-1.4-1.5 0-2.8-1-3.2-2.3.6.1 1.1.1 1.6-.1-1.7-.3-2.9-1.8-2.9-3.5.5.3 1.1.5 1.7.5-1.6-1.1-2.1-3.2-1.2-4.9 1.9 2.3 4.7 3.8 7.8 3.9-.5-2.2 1.2-4.3 3.5-4.3 1 0 1.9.4 2.5 1 .8-.2 1.5-.5 2.2-.8-.2.8-.8 1.4-1.5 1.8z" />
              </svg>
            </a>
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>
              <Link to="/" className="hover:text-indigo-600">
                Home
              </Link>
            </li>
            <li>
              <Link to="/products" className="hover:text-indigo-600">
                Products
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-600">
                Cart
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-600">
                Contact
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Categories</h4>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>
              <a href="#" className="hover:text-indigo-600">
                Electronics
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-600">
                Fashion
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-600">
                Home & Living
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-600">
                Beauty
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Newsletter</h4>
          <p className="mt-4 text-sm text-gray-600">Get updates on offers and new arrivals.</p>
          <form className="mt-4 space-y-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Subscribe
            </button>
          </form>
        </section>
      </div>

      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-xs text-gray-500 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} ShopSphere. All rights reserved.</p>
          <p>Built for seamless ecommerce experiences.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
