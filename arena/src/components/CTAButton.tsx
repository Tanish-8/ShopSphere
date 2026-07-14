import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface CTAButtonProps {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  icon?: "arrow" | "zap";
}

export default function CTAButton({
  variant = "primary",
  children,
  icon = "arrow",
}: CTAButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = nextId.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 700);
  };

  const Icon = icon === "arrow" ? ArrowRight : Zap;

  if (variant === "primary") {
    return (
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-shadow hover:shadow-violet-500/50"
      >
        {/* Shimmer overlay */}
        <motion.span
          className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ["−100%", "200%"] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2 }}
          aria-hidden="true"
        />

        {/* Ripples */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              className="pointer-events-none absolute rounded-full bg-white/30"
              style={{ left: ripple.x, top: ripple.y, x: "-50%", y: "-50%" }}
              initial={{ width: 0, height: 0, opacity: 0.6 }}
              animate={{ width: 200, height: 200, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              aria-hidden="true"
            />
          ))}
        </AnimatePresence>

        <span className="relative flex items-center gap-2">
          {children}
          <Icon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/25"
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full bg-white/15"
            style={{ left: ripple.x, top: ripple.y, x: "-50%", y: "-50%" }}
            initial={{ width: 0, height: 0, opacity: 0.5 }}
            animate={{ width: 180, height: 180, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            aria-hidden="true"
          />
        ))}
      </AnimatePresence>
      <span className="relative flex items-center gap-2">
        {children}
        <Icon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </motion.button>
  );
}
