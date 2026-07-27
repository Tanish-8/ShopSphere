import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { staggerContainer, viewportConfig } from '../../utils/animations';

const AnimatedProductGrid = ({ children, className, columns }) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-[repeat(auto-fill,minmax(290px,1fr))]',
    5: 'grid-cols-[repeat(auto-fill,minmax(290px,1fr))]'
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={viewportConfig}
      className={cn(
        "grid gap-6",
        columns ? (gridCols[columns] || 'grid-cols-[repeat(auto-fill,minmax(290px,1fr))]') : 'grid-cols-[repeat(auto-fill,minmax(290px,1fr))]',
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
