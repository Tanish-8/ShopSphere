# Featured Products Components

Arena.ai-inspired featured products section with enhanced visual effects.

## Components

### FeaturedSection
Main section container with animated header and decorative elements.

**Props:**
- `title` (string): Section title - default "Featured Products"
- `subtitle` (string): Section description
- `badge` (string): Small badge text - default "Curated Collection"
- `showViewAll` (boolean): Show view all button - default true
- `viewAllText` (string): Button text - default "View All Products"
- `onViewAllClick` (function): Click handler for view all button
- `children` (ReactNode): Content to display in the section
- `className` (string): Additional container classes
- `containerClassName` (string): Additional content wrapper classes
- `headerClassName` (string): Additional header classes

### FeaturedProductCard
Enhanced product card with 3D tilt effect, glow, and shadow animations. Wraps the existing ProductCard component.

**Props:**
- `product` (object): Product data (same as existing ProductCard)
- `isWishlisted` (boolean): Wishlist state
- `onWishlistToggle` (function): Wishlist toggle callback
- `className` (string): Additional classes

**Features:**
- 3D tilt effect on hover
- Enhanced shadow on hover
- Soft glow effect
- Smooth transitions
- All existing ProductCard functionality preserved

### AnimatedProductGrid
Grid container with staggered entrance animations.

**Props:**
- `children` (ReactNode): Product cards or other content
- `columns` (number): Number of columns (2-4) - default 4
- `className` (string): Additional grid classes

**Features:**
- Responsive grid layout
- Staggered entrance animations
- Viewport-based animation triggering

### ProductSkeleton
Loading skeleton matching the product card layout.

**Props:** None

## Usage Example

```jsx
import { FeaturedSection, FeaturedProductCard, AnimatedProductGrid, ProductSkeleton } from '../components/featured';

const MyFeaturedSection = ({ products, isLoading }) => {
  const [wishlisted, setWishlisted] = useState(new Set());

  const handleWishlistToggle = (productId) => {
    setWishlisted(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  return (
    <FeaturedSection
      title="Featured Products"
      subtitle="Handpicked products selected for you."
      badge="Curated Collection"
      onViewAllClick={() => navigate('/products')}
    >
      {isLoading ? (
        <AnimatedProductGrid>
          {[...Array(4)].map((_, i) => <ProductSkeleton key={i} />)}
        </AnimatedProductGrid>
      ) : (
        <AnimatedProductGrid columns={4}>
          {products.map(product => (
            <FeaturedProductCard
              key={product._id}
              product={product}
              isWishlisted={wishlisted.has(product._id)}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </AnimatedProductGrid>
      )}
    </FeaturedSection>
  );
};
```

## Integration with Existing ProductCard

The `FeaturedProductCard` wraps your existing `ProductCard` component and adds visual enhancements:
- 3D tilt effect
- Enhanced shadows
- Glow effects
- Smooth animations

All existing functionality is preserved:
- Cart integration
- Wishlist state
- Compare functionality
- Routing
- Stock handling
- Error handling

## Dependencies

All dependencies are already installed in your project:
- `framer-motion` - Animations
- `lucide-react` - Icons
- `clsx` - Class names
- `tailwind-merge` - Tailwind class merging

## Customization

The components use Tailwind CSS classes and can be customized via:
- `className` props for additional styling
- Animation configurations in `utils/animations.js`
- Tailwind theme configuration

## Performance

- Uses `framer-motion` for hardware-accelerated animations
- Viewport-based animations trigger only when visible
- Staggered animations for smooth entrance
- 3D transforms use GPU acceleration
