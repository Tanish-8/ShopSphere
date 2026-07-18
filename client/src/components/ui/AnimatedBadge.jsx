import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const AnimatedBadge = ({ count, className, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-600',
    pink: 'bg-pink-600',
    red: 'bg-red-500',
    blue: 'bg-blue-600'
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={cn(
            "absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white",
            "ring-2 ring-white dark:ring-gray-900 shadow-md shadow-black/10",
            colorClasses[color] || colorClasses.indigo,
            className
          )}
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  );
};

export default AnimatedBadge;
