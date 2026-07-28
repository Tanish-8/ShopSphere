import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ProductCard from "../product/ProductCard";
import { fetchProducts } from "../../services/productService";
import { fetchWishlist, addToWishlist, removeFromWishlist } from "../../services/wishlistService";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate } from "react-router-dom";

const FALLBACK_HERO_PRODUCTS = [
  {
    _id: "65e8a1b2c3d4e5f6a7b8c9d1",
    name: "AuraSound Pro X Wireless Headphones",
    brand: "AuraSound",
    category: "Audio",
    price: 349,
    originalPrice: 399,
    discount: 12,
    rating: 5,
    numReviews: 128,
    badge: "Featured",
    stock: 15,
    images: ["/images/product-headphones.png"],
    image: "/images/product-headphones.png",
  },
  {
    _id: "65e8a1b2c3d4e5f6a7b8c9d2",
    name: "Chrono Elite 5 Smartwatch",
    brand: "Chrono",
    category: "Wearables",
    price: 599,
    originalPrice: 699,
    discount: 14,
    rating: 5,
    numReviews: 94,
    badge: "Bestseller",
    stock: 8,
    images: ["/images/product-watch.png"],
    image: "/images/product-watch.png",
  },
  {
    _id: "65e8a1b2c3d4e5f6a7b8c9d3",
    name: "UrbanStep Air Running Sneakers",
    brand: "UrbanStep",
    category: "Footwear",
    price: 189,
    originalPrice: 229,
    discount: 17,
    rating: 4,
    numReviews: 62,
    badge: "Sale",
    stock: 20,
    images: ["/images/product-sneakers.png"],
    image: "/images/product-sneakers.png",
  },
  {
    _id: "65e8a1b2c3d4e5f6a7b8c9d4",
    name: "Luxe Tote Signature Leather Bag",
    brand: "Luxe",
    category: "Accessories",
    price: 279,
    originalPrice: 320,
    discount: 12,
    rating: 5,
    numReviews: 45,
    badge: "New",
    stock: 12,
    images: ["/images/product-bag.png"],
    image: "/images/product-bag.png",
  },
];

/**
 * Increased per-card floating motion personalities for visual depth and 3D floating effect.
 * Featured: ±22px vertical
 * Top Right: ±18px vertical, ±10px horizontal, 1.2° rotation
 * Bottom Left: ±25px vertical, -12px horizontal, -1° rotation
 * Bottom Right: ±16px vertical, ±8px horizontal, 0.5° rotation
 */
const FLOAT_PERSONALITIES = [
  {
    // Slot 0 — Main Featured Card (Dominant focal point)
    duration: 6.5,
    delay: 0,
    keyframes: {
      y: [0, -22, 0],
      x: [0, 0, 0],
      rotate: [0, 0, 0],
    },
  },
  {
    // Slot 1 — Top Right Card
    duration: 7.2,
    delay: 0.8,
    keyframes: {
      y: [0, -18, 0],
      x: [0, 10, 0],
      rotate: [0, 1.2, 0],
    },
  },
  {
    // Slot 2 — Bottom Left Card
    duration: 6.8,
    delay: 1.5,
    keyframes: {
      y: [0, -25, 0],
      x: [0, -12, 0],
      rotate: [0, -1, 0],
    },
  },
  {
    // Slot 3 — Bottom Right Card
    duration: 7.8,
    delay: 2.3,
    keyframes: {
      y: [0, -16, 0],
      x: [0, 8, 0],
      rotate: [0, 0.5, 0],
    },
  },
];

/** Individual floating wrapper with independent hover control and GPU transform acceleration */
function FloatingWrapper({ config, shouldReduceMotion, children }) {
  const [hovered, setHovered] = useState(false);

  const floatAnimate = shouldReduceMotion
    ? {}
    : hovered
    ? { y: -8, x: 0, rotate: 0, scale: 1.04 }
    : {
        y: config.keyframes.y,
        x: config.keyframes.x,
        rotate: config.keyframes.rotate,
        scale: 1,
      };

  const floatTransition = hovered
    ? { duration: 0.25, ease: "easeOut" }
    : {
        duration: config.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: config.delay,
      };

  return (
    <motion.div
      animate={floatAnimate}
      transition={floatTransition}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ willChange: "transform" }}
      className={`relative transition-[z-index,box-shadow] duration-300 ${
        hovered ? "z-50" : "z-10"
      }`}
    >
      {/* 15–20% scaled wrapper for floating showcase aesthetic */}
      <div className="transform scale-[0.82] sm:scale-[0.86] lg:scale-[0.88] origin-center max-w-[270px] mx-auto">
        {children}
      </div>
    </motion.div>
  );
}

export default function ProductShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const toast = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState(FALLBACK_HERO_PRODUCTS);
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const fetched = await fetchProducts({ limit: 4 });
        if (isMounted && Array.isArray(fetched) && fetched.length >= 4) {
          setProducts(fetched.slice(0, 4));
        }
      } catch (e) {
        // Fallback remains active
      }
    })();

    if (isAuthenticated) {
      (async () => {
        try {
          const list = await fetchWishlist();
          if (isMounted && Array.isArray(list)) {
            setWishlistIds(list.map((p) => p._id || p.id));
          }
        } catch (e) {
          // ignore
        }
      })();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleWishlistToggle = async (productId) => {
    if (!isAuthenticated) {
      toast.info("Please log in to manage your wishlist.");
      navigate("/login");
      return;
    }
    const isSaved = wishlistIds.includes(productId);
    try {
      if (isSaved) {
        await removeFromWishlist(productId);
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
        toast.success("Removed from wishlist.");
      } else {
        await addToWishlist(productId);
        setWishlistIds((prev) => [...prev, productId]);
        toast.success("Added to wishlist.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update wishlist.");
    }
  };

  return (
    <div
      className="relative w-full max-w-[620px] mx-auto py-2 px-1 select-none"
      aria-label="Product showcase"
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0 m-auto h-52 w-52 rounded-full bg-indigo-600/15 blur-3xl"
        aria-hidden="true"
      />

      {/*
        CSS Grid composition with 15–20% scaled cards & generous 24–32px gap.
        Cards never overlap and float independently via GPU transforms.
      */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-stretch">
        {products.map((product, idx) => {
          const productId = product._id || product.id;
          const isWishlisted = wishlistIds.includes(productId);
          const personality = FLOAT_PERSONALITIES[idx % FLOAT_PERSONALITIES.length];

          return (
            <FloatingWrapper
              key={productId || idx}
              config={personality}
              shouldReduceMotion={shouldReduceMotion}
            >
              <ProductCard
                product={product}
                isWishlisted={isWishlisted}
                onWishlistToggle={handleWishlistToggle}
              />
            </FloatingWrapper>
          );
        })}
      </div>
    </div>
  );
}
