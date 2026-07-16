import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { fadeInLeft, fadeInRight, viewportConfigOnce } from '../../utils/animations';

const FeaturedSection = ({ 
  title = "Featured Products", 
  subtitle = "Handpicked products selected for you. Discover our latest innovations and timeless classics.",
  badge = "Curated Collection",
  showViewAll = true,
  viewAllText = "View All Products",
  onViewAllClick,
  children,
  className,
  containerClassName,
  headerClassName
}) => {
  return (
    <section className={cn("py-24 px-6 md:px-12 lg:px-24 bg-neutral-50/30 overflow-hidden", className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfigOnce}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest uppercase text-xs">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{badge}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900">
              {title}
            </h2>
            <p className="text-lg text-neutral-500 max-w-lg leading-relaxed">
              {subtitle}
            </p>
          </motion.div>

          {showViewAll && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportConfigOnce}
              whileHover={{ x: 5 }}
              onClick={onViewAllClick}
              className="flex items-center gap-2 text-neutral-900 font-bold group cursor-pointer"
            >
              {viewAllText}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </motion.button>
          )}
        </div>

        {/* Content Section */}
        <div className={cn("", containerClassName)}>
          {children}
        </div>

        {/* Footer Decorative Element */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={viewportConfigOnce}
          className="mt-20 pt-10 border-t border-neutral-100 flex justify-center"
        >
          <p className="text-sm text-neutral-400 font-medium">
            Showing our premium collection
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedSection;
