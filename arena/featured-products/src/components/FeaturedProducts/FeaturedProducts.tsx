import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ProductGrid } from './ProductGrid';
import { ProductSkeleton } from './ProductSkeleton';
import { Product } from './ProductCard';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    title: "Aura Pods Pro",
    description: "Experience sound like never before with active noise cancellation and spatial audio.",
    price: 249,
    originalPrice: 299,
    rating: 4.8,
    reviewCount: 1240,
    image: "https://images.unsplash.com/photo-1588333328347-9dc02114d155?auto=format&fit=crop&q=80&w=800",
    badge: "Best Seller",
    stockStatus: "In Stock",
    isNew: true
  },
  {
    id: 2,
    title: "Horizon Watch Series X",
    description: "The most advanced health tracking on your wrist. Sleek, durable, and always on.",
    price: 399,
    originalPrice: 449,
    rating: 4.9,
    reviewCount: 856,
    image: "https://images.unsplash.com/photo-1544117518-30df16298199?auto=format&fit=crop&q=80&w=800",
    stockStatus: "Low Stock"
  },
  {
    id: 3,
    title: "ZenBook Air 15",
    description: "Power meets portability. The ultimate tool for creators and professionals.",
    price: 1299,
    originalPrice: 1499,
    rating: 4.7,
    reviewCount: 432,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800",
    stockStatus: "In Stock",
    isNew: true
  },
  {
    id: 4,
    title: "Lumina Desk Lamp",
    description: "Intelligent lighting that adapts to your environment and protects your eyes.",
    price: 89,
    originalPrice: 129,
    rating: 4.6,
    reviewCount: 215,
    image: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=800",
    stockStatus: "In Stock"
  }
];

export const FeaturedProducts: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-24 px-6 md:px-12 lg:px-24 bg-neutral-50/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest uppercase text-xs">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Curated Collection</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900">
              Featured Products
            </h2>
            <p className="text-lg text-neutral-500 max-w-lg leading-relaxed">
              Handpicked products selected for you. Discover our latest innovations and timeless classics.
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ x: 5 }}
            className="flex items-center gap-2 text-neutral-900 font-bold group"
          >
            View All Products
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>

        {/* Grid Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[...Array(4)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <ProductGrid products={MOCK_PRODUCTS} />
        )}

        {/* Footer Decorative Element */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 pt-10 border-t border-neutral-100 flex justify-center"
        >
          <p className="text-sm text-neutral-400 font-medium">
            Showing 4 of 24 premium products
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
