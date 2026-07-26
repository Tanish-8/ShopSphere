import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (toast.type === "loading") return;

    if (!hovered) {
      const interval = 30; // ms
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timerRef.current);
            onDismiss(toast.id);
            return 0;
          }
          return prev - (interval / toast.duration) * 100;
        });
      }, interval);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hovered, toast.id, toast.duration, toast.type, onDismiss]);

  const typeConfig = {
    success: { bg: "bg-emerald-50 border-emerald-200 text-emerald-800", bar: "bg-emerald-500", icon: "✅" },
    error: { bg: "bg-rose-50 border-rose-200 text-rose-800", bar: "bg-rose-500", icon: "❌" },
    warning: { bg: "bg-amber-50 border-amber-300 text-amber-800", bar: "bg-amber-500", icon: "⚠️" },
    info: { bg: "bg-blue-50 border-blue-200 text-blue-800", bar: "bg-blue-500", icon: "ℹ️" },
    loading: { bg: "bg-gray-50 border-gray-200 text-gray-800", bar: "bg-indigo-500", icon: "⏳" }
  };

  const config = typeConfig[toast.type] || typeConfig.info;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="alert"
      aria-live="polite"
      className={`relative w-80 max-w-full rounded-2xl border p-4 shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 flex flex-col gap-2 ${config.bg}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg select-none">{config.icon}</span>
        <div className="flex-1 text-left min-w-0">
          <p className="font-extrabold text-xs tracking-tight">{toast.message}</p>
          {toast.details && (
            <div className="mt-1 text-[11px] font-semibold text-gray-500 leading-normal">
              {toast.details}
            </div>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-gray-400 hover:text-gray-600 font-bold text-xs select-none cursor-pointer"
        >
          ✕
        </button>
      </div>

      {toast.type !== "loading" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50 rounded-b-2xl overflow-hidden">
          <div
            className={`h-full ${config.bar} transition-all duration-30ms linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, details = null, options = {}) => {
    const key = `${type}_${message}`;
    
    setToasts((prev) => {
      // Duplicate prevention / throttle: don't spawn if same message exists in the last 2 seconds
      const exists = prev.find((t) => t.key === key && Date.now() - t.createdAt < 2000);
      if (exists) {
        return prev.map((t) =>
          t.key === key ? { ...t, createdAt: Date.now() } : t
        );
      }

      const id = Math.random().toString(36).substring(2, 9);
      const newToast = {
        id,
        key,
        type,
        message,
        details,
        duration: options.duration || 4000,
        createdAt: Date.now()
      };
      
      return [...prev, newToast];
    });

    return {
      id: Math.random().toString(36).substring(2, 9), // will be used to reference if needed
      dismiss: () => dismiss(key)
    };
  }, [dismiss]);

  const success = useCallback((msg, details, opts) => addToast("success", msg, details, opts), [addToast]);
  const error = useCallback((msg, details, opts) => addToast("error", msg, details, opts), [addToast]);
  const warning = useCallback((msg, details, opts) => addToast("warning", msg, details, opts), [addToast]);
  const info = useCallback((msg, details, opts) => addToast("info", msg, details, opts), [addToast]);
  const loading = useCallback((msg, details, opts) => addToast("loading", msg, details, opts), [addToast]);

  const value = useMemo(() => ({
    success,
    error,
    warning,
    info,
    loading,
    dismiss
  }), [success, error, warning, info, loading, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Notification Container Portal/Portal-like wrapper */}
      <div className="fixed z-50 flex flex-col gap-3 max-w-sm pointer-events-none select-none
        top-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 md:top-6"
      >
        <div className="flex flex-col gap-3 pointer-events-auto">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
