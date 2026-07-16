import { motion, useReducedMotion } from "framer-motion";
import { Star, ShoppingBag } from "lucide-react";

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-white/10 text-white/20"
          }`}
        />
      ))}
    </div>
  );
}

export default function DecorativeHeroCard({
  image,
  name,
  category,
  price,
  rating,
  badge,
  className = "",
  delay = 0,
  floatAmplitude = 12,
  floatDuration = 4,
  style,
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`absolute ${className}`}
      style={style}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, type: "spring", stiffness: 80 }}
    >
      {/* Floating animation wrapper */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -floatAmplitude, 0],
              }
        }
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Card body */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.06] p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl text-left">
            {/* Gradient border shimmer */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.15) 50%, rgba(255,255,255,0.05) 100%)",
              }}
              aria-hidden="true"
            />

            {/* Badge */}
            {badge && (
              <div className="absolute right-3 top-3 z-10 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-violet-500/40">
                {badge}
              </div>
            )}

            {/* Product image */}
            <div className="relative mb-3 flex h-36 items-center justify-center overflow-hidden rounded-xl bg-white/5">
              <img
                src={image}
                alt={name}
                className="h-full w-full object-contain drop-shadow-2xl"
              />
              {/* Glow under image */}
              <div className="pointer-events-none absolute bottom-0 left-1/2 h-10 w-3/4 -translate-x-1/2 rounded-full bg-violet-600/20 blur-xl" aria-hidden="true" />
            </div>

            {/* Card info */}
            <div className="relative space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">
                {category}
              </p>
              <h3 className="text-sm font-semibold leading-tight text-white">{name}</h3>
              <div className="flex items-center justify-between">
                <StarRating rating={rating} />
                <span className="text-[10px] text-slate-400">({rating})</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold text-white">{price}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/40">
                  <ShoppingBag className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
      </motion.div>
    </motion.div>
  );
}
