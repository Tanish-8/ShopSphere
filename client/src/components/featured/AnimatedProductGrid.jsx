import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { staggerContainer, viewportConfig } from '../../utils/animations';

const AnimatedProductGrid = ({ children, className, columns = 4 }) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={viewportConfig}
      className={cn(
        "grid gap-6 lg:gap-8",
        gridCols[columns] || gridCols[4],
        className
      )}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AnimatedProductGrid;
