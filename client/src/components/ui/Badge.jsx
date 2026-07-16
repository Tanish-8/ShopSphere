import React from 'react';
import { cn } from '../../utils/cn';

const Badge = ({ children, variant = 'new', className }) => {
  const variants = {
    discount: "bg-red-500 text-white",
    stock: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    new: "bg-blue-600 text-white",
    'stock-indicator': "bg-neutral-100 text-neutral-600 border border-neutral-200",
    'indigo': "bg-indigo-600 text-white",
    'rose': "bg-rose-500 text-white",
    'amber': "bg-amber-100 text-amber-700 border border-amber-200",
    'emerald': "bg-emerald-50 text-emerald-700"
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
      variants[variant] || variants.new,
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
