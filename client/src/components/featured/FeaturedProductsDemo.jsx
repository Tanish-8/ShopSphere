import React, { useState, useEffect } from 'react';
import { FeaturedSection, FeaturedProductCard, AnimatedProductGrid, ProductSkeleton } from './index';

// Demo component showing how to use the featured products section
// This can be integrated into your existing pages (Home, Shop, etc.)

const FeaturedProductsDemo = ({ products = [], isLoading = false }) => {
  const [wishlistedProducts, setWishlistedProducts] = useState(new Set());

  const handleWishlistToggle = (productId) => {
    setWishlistedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleViewAllClick = () => {
    // Navigate to your products page
    // navigate('/products');
    console.log('Navigate to all products');
  };

  return (
    <FeaturedSection
      title="Featured Products"
      subtitle="Handpicked products selected for you. Discover our latest innovations and timeless classics."
      badge="Curated Collection"
      showViewAll={true}
      viewAllText="View All Products"
      onViewAllClick={handleViewAllClick}
    >
      {isLoading ? (
        <AnimatedProductGrid>
          {[...Array(4)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </AnimatedProductGrid>
      ) : (
        <AnimatedProductGrid columns={4}>
          {products.map((product) => (
            <FeaturedProductCard
              key={product._id || product.id}
              product={product}
              isWishlisted={wishlistedProducts.has(product._id || product.id)}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </AnimatedProductGrid>
      )}
    </FeaturedSection>
  );
};

export default FeaturedProductsDemo;
