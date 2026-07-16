import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export const CartButton = ({ count = 3 }) => {
  const [isBouncing, setIsBouncing] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors group"
      aria-label="Cart"
    >
      <motion.div
        animate={isBouncing ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <ShoppingCart size={22} className="text-zinc-600 group-hover:text-zinc-900 transition-colors" />
      </motion.div>
      
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-blue-600 text-[10px] font-bold text-white rounded-full border-2 border-white shadow-sm"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
