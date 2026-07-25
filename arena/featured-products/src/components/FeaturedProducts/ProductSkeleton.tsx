import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="group relative flex flex-col bg-white rounded-3xl p-4 shadow-sm border border-neutral-100 h-full overflow-hidden">
      {/* Image Skeleton */}
      <div className="relative aspect-square mb-6 overflow-hidden rounded-2xl bg-neutral-100 animate-pulse" />
      
      {/* Content Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-2/3 bg-neutral-100 rounded animate-pulse" />
        <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-4 w-12 bg-neutral-100 rounded animate-pulse" />
          <div className="h-4 w-12 bg-neutral-100 rounded animate-pulse" />
        </div>
        <div className="pt-4 flex items-center justify-between">
          <div className="h-8 w-24 bg-neutral-100 rounded animate-pulse" />
          <div className="h-8 w-24 bg-neutral-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};
