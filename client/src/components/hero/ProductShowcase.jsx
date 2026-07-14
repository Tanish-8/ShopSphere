import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import DecorativeHeroCard from "./DecorativeHeroCard";

const products = [
  {
    id: 1,
    image: "/images/product-headphones.png",
    name: "AuraSound Pro X",
    category: "Audio",
    price: "$349",
    rating: 4.9,
    badge: "New",
    className: "top-4 left-8 w-52",
    delay: 0.2,
    floatAmplitude: 10,
    floatDuration: 5,
    depth: 1,
  },
  {
    id: 2,
    image: "/images/product-watch.png",
    name: "Chrono Elite 5",
    category: "Wearables",
    price: "$599",
    rating: 4.8,
    badge: "Hot",
    className: "top-2 right-4 w-48",
    delay: 0.5,
    floatAmplitude: 14,
    floatDuration: 4.5,
    depth: 1.5,
  },
  {
    id: 3,
    image: "/images/product-sneakers.png",
    name: "UrbanStep Air",
    category: "Footwear",
    price: "$189",
    rating: 4.7,
    badge: "Sale",
    className: "bottom-16 left-4 w-52",
    delay: 0.8,
    floatAmplitude: 8,
    floatDuration: 6,
    depth: 0.7,
  },
  {
    id: 4,
    image: "/images/product-bag.png",
    name: "Luxe Tote Signature",
    category: "Accessories",
    price: "$279",
    rating: 4.6,
    className: "bottom-8 right-2 w-48",
    delay: 1.1,
    floatAmplitude: 12,
    floatDuration: 5.5,
    depth: 1.2,
  },
];

function ParallaxCard({
  product,
  springX,
  springY,
  shouldReduceMotion,
}) {
  const rangeOut = product.depth * 20;
  const rangeOutY = product.depth * 12;

  const parallaxX = useTransform(springX, [-0.5, 0.5], [-rangeOut, rangeOut]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-rangeOutY, rangeOutY]);

  return (
    <motion.div
      style={shouldReduceMotion ? {} : { x: parallaxX, y: parallaxY }}
      className="absolute inset-0"
    >
      <DecorativeHeroCard
        image={product.image}
        name={product.name}
        category={product.category}
        price={product.price}
        rating={product.rating}
        badge={product.badge}
        className={product.className}
        delay={product.delay}
        floatAmplitude={product.floatAmplitude}
        floatDuration={product.floatDuration}
      />
    </motion.div>
  );
}

export default function ProductShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const handleMouseMove = (e) => {
    if (shouldReduceMotion) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-full w-full"
      aria-label="Product showcase"
    >
      {/* Decorative rings */}
      <motion.div
        className="absolute inset-0 m-auto h-[380px] w-[380px] rounded-full border border-white/5"
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute inset-0 m-auto h-[280px] w-[280px] rounded-full border border-violet-500/10"
        animate={shouldReduceMotion ? {} : { rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />

      {/* Central glow */}
      <div
        className="pointer-events-none absolute inset-0 m-auto h-32 w-32 rounded-full bg-violet-600/20 blur-3xl"
        aria-hidden="true"
      />

      {/* Product cards with parallax depth */}
      {products.map((product) => (
        <ParallaxCard
          key={product.id}
          product={product}
          springX={springX}
          springY={springY}
          shouldReduceMotion={shouldReduceMotion}
        />
      ))}
    </div>
  );
}
