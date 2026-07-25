import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star, ShoppingBag } from "lucide-react";

interface ProductCardProps {
  image: string;
  name: string;
  category: string;
  price: string;
  rating: number;
  badge?: string;
  className?: string;
  delay?: number;
  floatAmplitude?: number;
  floatDuration?: number;
  style?: React.CSSProperties;
}

function StarRating({ rating }: { rating: number }) {
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

export default function ProductCard({
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
}: ProductCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -8;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 8;
    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
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
        {/* Tilt wrapper */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          animate={{
            rotateX: tilt.rotateX,
            rotateY: tilt.rotateY,
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ transformStyle: "preserve-3d", perspective: 800 }}
          className="cursor-pointer"
        >
          {/* Card body */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.06] p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
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
              <motion.img
                src={image}
                alt={name}
                className="h-full w-full object-contain drop-shadow-2xl"
                animate={isHovered ? { scale: 1.08 } : { scale: 1 }}
                transition={{ duration: 0.3 }}
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
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/40"
                  aria-label={`Add ${name} to bag`}
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
