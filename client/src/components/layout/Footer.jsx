import { Link } from "react-router-dom";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="mt-20 border-t border-[#E8E1D8] dark:border-gray-800 bg-[#F1ECE5] dark:bg-[#0b1329] text-gray-900 dark:text-gray-100">
      {/* Top Footer Section */}
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-5 text-left">
        {/* Column 1: Brand & Contact Info */}
        <section className="lg:col-span-2 space-y-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="rounded-lg bg-indigo-600 px-2 py-1 text-sm font-black text-white">SS</span>
            <span className="text-lg font-black text-gray-900 tracking-tight">ShopSphere</span>
          </Link>
          <p className="max-w-md text-xs leading-relaxed text-gray-500 font-medium">
            Your premier global shopping destination. Delivering excellence, security, and top-tier curated goods directly to your door.
          </p>
          <div className="space-y-2.5 text-xs text-gray-600 font-semibold">
            <p className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span>100 Innovation Way, Suite 400, Tech City, TC 94016</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-base">📞</span>
              <span>+1 (800) 555-SHOP (Mon - Fri, 9AM - 6PM EST)</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-base">✉️</span>
              <a href="mailto:support@shopsphere.dev" className="hover:text-indigo-600 transition">
                support@shopsphere.dev
              </a>
            </p>
          </div>
        </section>

        {/* Column 2: Customer Support & Legal Policies */}
        <section>
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">Customer Service</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-gray-500 font-bold">
            <li>
              <Link to="/help" className="hover:text-indigo-600 transition">
                Help & FAQs
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-indigo-600 transition">
                Track Your Order
              </Link>
            </li>
            <li>
              <Link to="/addresses" className="hover:text-indigo-600 transition">
                Shipping & Delivery
              </Link>
            </li>
            <li>
              <Link to="/help" className="hover:text-indigo-600 transition">
                Returns & Exchanges
              </Link>
            </li>
          </ul>
        </section>

        {/* Column 3: Legal & Policies */}
        <section>
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">Legal Policies</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-gray-500 font-bold">
            <li>
              <a href="#" className="hover:text-indigo-600 transition">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-600 transition">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-600 transition">
                Refund Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-indigo-600 transition">
                Intellectual Property
              </a>
            </li>
          </ul>
        </section>

        {/* Column 4: App Download & Newsletter */}
        <section className="space-y-5">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">Download Our App</h4>
            <p className="mt-2 text-xs text-gray-500 font-semibold leading-relaxed">
              Shop on the go with fast checkout, updates, and custom rewards.
            </p>
            {/* Download Buttons */}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row lg:flex-col">
              {/* App Store */}
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-white hover:bg-gray-800 transition"
              >
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.56 2.95-1.39" />
                </svg>
                <div className="text-[9px] font-bold text-left leading-none">
                  <span className="block text-[7px] text-gray-400 font-medium">Download on the</span>
                  App Store
                </div>
              </a>
              {/* Play Store */}
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-white hover:bg-gray-800 transition"
              >
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.783 12 3.609 22.186A2.229 2.229 0 0 1 3 20.626V3.374c0-.629.229-1.2.609-1.56zM14.49 12.707l2.84 2.84-13.013 7.42c-.22.12-.469.19-.717.2l10.89-10.46zM14.49 11.293L20.89 5.163l-10.89 10.46c.248-.01.497-.08.717-.2l2.84-2.84z" />
                </svg>
                <div className="text-[9px] font-bold text-left leading-none">
                  <span className="block text-[7px] text-gray-400 font-medium">GET IT ON</span>
                  Google Play
                </div>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Footer Section: Social Links, Payments, and Copyright */}
      <div className="border-t border-gray-200 py-8 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright Info */}
          <div className="text-xs text-gray-400 font-bold text-center md:text-left space-y-1">
            <p>&copy; {new Date().getFullYear()} ShopSphere Ltd. All rights reserved.</p>
            <p className="text-[10px] font-semibold text-gray-400 leading-normal">
              Built for secure, high-fidelity online shopping experiences.
            </p>
          </div>

          {/* Payment Gateways Icons */}
          <div className="flex items-center gap-2">
            {/* Visa */}
            <span className="rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm text-[10px] font-black text-indigo-700 select-none tracking-tight">
              VISA
            </span>
            {/* Mastercard */}
            <span className="rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm text-[10px] font-black text-red-500 select-none tracking-tight">
              MC
            </span>
            {/* PayPal */}
            <span className="rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm text-[10px] font-black text-blue-800 select-none tracking-tight">
              PayPal
            </span>
            {/* Apple Pay */}
            <span className="rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm text-[10px] font-black text-gray-900 select-none tracking-tight">
               Pay
            </span>
            {/* Razorpay */}
            <span className="rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm text-[10px] font-black text-indigo-500 select-none tracking-tight">
              Razorpay
            </span>
          </div>

          {/* Social Icons & Back to Top */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <a href="#" className="rounded-full bg-white border border-gray-200 p-2 text-gray-400 hover:text-indigo-600 transition" aria-label="Instagram">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5a4.25 4.25 0 004.25 4.25h8.5a4.25 4.25 0 004.25-4.25v-8.5a4.25 4.25 0 00-4.25-4.25h-8.5z" />
                </svg>
              </a>
              <a href="#" className="rounded-full bg-white border border-gray-200 p-2 text-gray-400 hover:text-indigo-600 transition" aria-label="Facebook">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H8v3h2.4v8h3.1z" />
                </svg>
              </a>
            </div>

            {/* Back to Top */}
            <button
              type="button"
              onClick={scrollToTop}
              className="rounded-xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 active:scale-90 transition shadow-sm cursor-pointer"
              title="Back to Top"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
