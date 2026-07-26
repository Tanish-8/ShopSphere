import { motion, useReducedMotion } from "framer-motion";
import { useCurrency } from "../../contexts/CurrencyContext";
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
  const { convertPrice, formatCurrency } = useCurrency();

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
        <div className="relative overflow-hidden rounded-2xl border border-[#E8E1D8] dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm text-left">
            {/* Badge */}
            {badge && (
              <div className="absolute right-3 top-3 z-10 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                {badge}
              </div>
            )}

            {/* Product image */}
            <div className="relative mb-3 flex h-36 items-center justify-center overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900">
              <img
                src={image}
                alt={name}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Card info */}
            <div className="relative space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {category}
              </p>
              <h3 className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">{name}</h3>
              <div className="flex items-center justify-between">
                <StarRating rating={rating} />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">({rating})</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(convertPrice(price))}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors">
                  <ShoppingBag className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
      </motion.div>
    </motion.div>
  );
}


