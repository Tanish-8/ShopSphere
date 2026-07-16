import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

interface RatingProps {
  rating: number;
  count: number;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({ rating, count, className }) => {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-neutral-200 text-neutral-200"
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-neutral-500">
        ({count.toLocaleString()})
      </span>
    </div>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'discount' | 'stock' | 'new' | 'stock-indicator';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'new', className }) => {
  const variants = {
    discount: "bg-red-500 text-white",
    stock: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    new: "bg-blue-600 text-white",
    'stock-indicator': "bg-neutral-100 text-neutral-600 border border-neutral-200",
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
