import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../utils/cn';
import ProductCard from '../product/ProductCard';

const FeaturedProductCard = ({ product, isWishlisted, onWishlistToggle, className }) => {
  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "group relative transition-all duration-300 rounded-2xl p-4",
        "bg-white dark:bg-gray-800 border border-[#E8E1D8] dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-1",
        className
      )}
    >
      {/* Existing ProductCard - All functionality preserved */}
      <div className="relative">
        <ProductCard
          product={product}
          isWishlisted={isWishlisted}
          onWishlistToggle={onWishlistToggle}
          className="border-none shadow-none hover:shadow-none hover:translate-y-0 bg-transparent"
        />

        {/* Soft Glow Effect (on hover) */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl"
          style={{
            background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.03) 0%, transparent 70%)"
          }}
        />

        {/* Enhanced Ring Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-black/5 group-hover:ring-black/10 transition-all duration-500 -z-10"
        />
      </div>
    </motion.div>
  );
};

export default FeaturedProductCard;
