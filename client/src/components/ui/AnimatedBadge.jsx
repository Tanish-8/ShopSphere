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
            "absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white border-2 border-white shadow-sm",
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
