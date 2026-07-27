import {
  Smartphone,
  Shirt,
  Home,
  Trophy,
  Sparkles,
  Watch,
  Gamepad2,
  BookOpen,
  HeartPulse,
  Baby,
} from 'lucide-react';
import { CategoryCard } from './CategoryCard';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 1,
    name: 'Electronics',
    count: 1240,
    icon: Smartphone,
    image: 'https://images.unsplash.com/photo-1526733170371-09419137976e?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 2,
    name: 'Fashion',
    count: 3520,
    icon: Shirt,
    image: 'https://images.unsplash.com/photo-1445205170230-053b830c6050?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 3,
    name: 'Home & Living',
    count: 890,
    icon: Home,
    image: 'https://images.unsplash.com/photo-1484101403033-5710502d671a?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 4,
    name: 'Sports',
    count: 450,
    icon: Trophy,
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 5,
    name: 'Beauty',
    count: 1100,
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 6,
    name: 'Accessories',
    count: 760,
    icon: Watch,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 7,
    name: 'Gaming',
    count: 320,
    icon: Gamepad2,
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 8,
    name: 'Books',
    count: 2100,
    icon: BookOpen,
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 9,
    name: 'Health',
    count: 540,
    icon: HeartPulse,
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 10,
    name: 'Kids',
    count: 430,
    icon: Baby,
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=600',
  },
];

export const CategorySection = () => {
  return (
    <section id="categories" className="py-16 px-6 md:px-12 lg:px-16 bg-[#F3EFE8] dark:bg-[#0f172a] rounded-3xl border border-[#E8E1D8] dark:border-gray-800 shadow-sm scroll-mt-20">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
              Shop by Category
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-md">
              Discover products across our carefully curated collections.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4"
          >
            <Link
              to="/products"
              className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-[#E8E1D8] dark:border-gray-700 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              View All Categories
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
          {CATEGORIES.map((category, index) => (
            <CategoryCard
              key={category.id}
              index={index}
              {...category}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
