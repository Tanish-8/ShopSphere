import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">404 Error</p>
      <h1 className="mt-3 text-4xl font-bold text-gray-900 sm:text-5xl">Page Not Found</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
        The page you are looking for does not exist or may have been moved. Let&apos;s get you back to shopping.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Return Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
