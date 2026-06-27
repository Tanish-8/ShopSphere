import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api";

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage("Verification token is missing from the link URL.");
      return;
    }

    let active = true;

    async function verify() {
      try {
        const response = await api.post(`/auth/verify-email/${token}`);
        if (active) {
          setSuccess(true);
          setMessage(response.data?.message || "Email verified successfully!");
        }
      } catch (err) {
        if (active) {
          setSuccess(false);
          setMessage(err?.response?.data?.message || err.message || "Email verification failed. The link may have expired.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 mt-10 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verification</h2>

      {loading ? (
        <div className="py-6 flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
          <span className="text-sm text-gray-500">Verifying your email...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {success ? (
            <div className="space-y-3">
              <span className="block text-4xl text-green-600">✓</span>
              <p className="text-lg font-semibold text-green-700">Success!</p>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="block text-4xl text-red-600">✕</span>
              <p className="text-lg font-semibold text-red-700">Verification Failed</p>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Go to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
