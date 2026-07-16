import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge, Rating } from './Common';

export interface Product {
  id: string | number;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  badge?: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  isNew?: boolean;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
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
    setIsHovered(false);
  };

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="group relative flex flex-col bg-white rounded-3xl p-4 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)] border border-neutral-100/50 hover:border-transparent cursor-pointer overflow-hidden"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square mb-6 overflow-hidden rounded-2xl bg-neutral-50">
        <motion.img
          src={product.image}
          alt={product.title}
          animate={{ scale: isHovered ? 1.08 : 1 }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {discount && (
            <Badge variant="discount">-{discount}% OFF</Badge>
          )}
          {product.isNew && (
            <Badge variant="new">New Arrival</Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          className={cn(
            "absolute top-4 right-4 z-10 p-2.5 rounded-full backdrop-blur-md transition-all duration-300",
            isWishlisted 
              ? "bg-red-50 text-red-500 shadow-sm" 
              : "bg-white/80 text-neutral-600 hover:bg-white shadow-sm"
          )}
        >
          <motion.div
            animate={isWishlisted ? { scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Heart 
              className={cn("w-5 h-5", isWishlisted && "fill-current")} 
            />
          </motion.div>
        </motion.button>

        {/* Overlays (Apple/Nike style) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-3 bottom-3 flex flex-col gap-2"
            >
              <button className="w-full bg-white/95 backdrop-blur-md text-black py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-black hover:text-white transition-all duration-300">
                <ShoppingCart className="w-4 h-4" />
                Quick Add
              </button>
              <button className="w-full bg-black/5 backdrop-blur-md text-black py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm border border-black/5 hover:bg-white transition-all duration-300">
                <Eye className="w-4 h-4" />
                Quick View
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col px-1">
        <div className="flex justify-between items-center mb-3">
          <Badge variant="stock" className="normal-case py-1 px-3 text-[11px]">
            {product.stockStatus}
          </Badge>
          <Rating rating={product.rating} count={product.reviewCount} />
        </div>

        <h3 className="text-[17px] font-semibold text-neutral-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {product.title}
        </h3>
        
        <p className="text-[13px] text-neutral-500 line-clamp-2 mb-4 leading-relaxed">
          {product.description}
        </p>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-bold text-neutral-900 tracking-tight">
                ${product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-[15px] text-neutral-400 line-through font-medium">
                  ${product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="lg:hidden">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="bg-black text-white p-3 rounded-2xl shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Soft Glow Effect (on hover) */}
      {/* Background Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.03) 0%, transparent 70%)"
        }}
      />
      <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-black/5 group-hover:ring-black/10 transition-all duration-500" />
    </motion.div>
  );
};
