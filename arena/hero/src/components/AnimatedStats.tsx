import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { value: 50, suffix: "K+", label: "Customers" },
  { value: 180, suffix: "+", label: "Products" },
  { value: 99, suffix: "%", label: "Satisfaction" },
];

function CountUp({
  target,
  suffix,
  started,
}: {
  target: number;
  suffix: string;
  started: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!started) return;
    if (shouldReduceMotion) {
      setCount(target);
      return;
    }

    const duration = 1800;
    const startTime = performance.now();

    const tick = (now: number) => {
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
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.15 + 0.2, duration: 0.5 }}
          className="flex flex-col"
        >
          <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            <CountUp target={stat.value} suffix={stat.suffix} started={isInView} />
          </span>
          <span className="text-xs font-medium text-slate-400">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
