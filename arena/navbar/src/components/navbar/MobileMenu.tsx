import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, ShoppingCart, Heart, User, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const mobileLinks = [
  { label: 'New Arrivals', href: '#' },
  { label: 'Collections', href: '#' },
  { label: 'Mens', href: '#' },
  { label: 'Womens', href: '#' },
  { label: 'Accessories', href: '#' },
  { label: 'Sale', href: '#', highlighted: true },
];

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 -mr-2 text-zinc-600 hover:text-zinc-900 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-[101] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ShopSphere
                </span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 text-zinc-600 hover:text-zinc-900"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 bg-zinc-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Main Links */}
                <nav className="space-y-1">
                  {mobileLinks.map((link, index) => (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl transition-colors",
                        link.highlighted ? "text-red-500 font-semibold bg-red-50" : "text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      {link.label}
                      <ChevronRight size={18} className="text-zinc-400" />
                    </motion.a>
                  ))}
                </nav>

                <hr className="border-zinc-100" />

                {/* Secondary Links */}
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 text-zinc-700 gap-2">
                    <Heart size={20} />
                    <span className="text-xs font-medium">Wishlist</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 text-zinc-700 gap-2">
                    <ShoppingCart size={20} />
                    <span className="text-xs font-medium">Cart</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 text-zinc-700 gap-2 col-span-2">
                    <User size={20} />
                    <span className="text-xs font-medium">My Account</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border-t">
                <button className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium active:scale-[0.98] transition-transform">
                  Sign In
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
