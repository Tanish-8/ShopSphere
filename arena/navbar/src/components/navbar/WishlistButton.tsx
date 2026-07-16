import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WishlistButton = ({ count = 5 }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors group"
      aria-label="Wishlist"
    >
      <Heart 
        size={22} 
        className="text-zinc-600 group-hover:text-red-500 transition-colors group-hover:fill-red-500" 
      />
      
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-[10px] font-bold text-white rounded-full border-2 border-white shadow-sm"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
