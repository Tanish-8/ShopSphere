import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

const StarRating = ({ rating, count, className, size = 'sm' }) => {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeClasses[size],
              "transition-colors",
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-neutral-200 text-neutral-200"
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs font-medium text-neutral-500">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
};

export default StarRating;
