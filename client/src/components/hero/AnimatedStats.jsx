import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const stats = [
  { value: 50, suffix: "K+", label: "Customers" },
  { value: 180, suffix: "+", label: "Products" },
  { value: 99, suffix: "%", label: "Satisfaction" },
];

function CountUp({ target, suffix, started }) {
  const shouldReduceMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!started) return;
    if (shouldReduceMotion) {
      setCount(target);
      return;
    }

    const duration = 1800;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, started, shouldReduceMotion]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export default function AnimatedStats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-6">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0px)" : "translateY(16px)",
            transition: `opacity 0.5s ease ${i * 0.15 + 0.2}s, transform 0.5s ease ${i * 0.15 + 0.2}s`
          }}
          className="flex flex-col"
        >
          <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            <CountUp target={stat.value} suffix={stat.suffix} started={isInView} />
          </span>
          <span className="text-xs font-medium text-slate-400">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
