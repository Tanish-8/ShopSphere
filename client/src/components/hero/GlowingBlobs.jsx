import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";

const blobs = [
  {
    id: 1,
    className:
      "absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]",
    animate: { x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] },
    duration: 12,
  },
  {
    id: 2,
    className:
      "absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full bg-indigo-50/25 blur-[100px]",
    animate: { x: [0, -50, 30, 0], y: [0, 40, -30, 0], scale: [1, 0.9, 1.15, 1] },
    duration: 15,
  },
  {
    id: 3,
    className:
      "absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-purple-50/20 blur-[90px]",
    animate: { x: [0, 30, -40, 0], y: [0, -20, 30, 0], scale: [1, 1.2, 0.9, 1] },
    duration: 10,
  },
  {
    id: 4,
    className:
      "absolute top-1/4 left-1/2 w-[300px] h-[300px] rounded-full bg-fuchsia-600/15 blur-[80px]",
    animate: { x: [0, -20, 35, 0], y: [0, 30, -15, 0], scale: [1, 1.05, 0.95, 1] },
    duration: 18,
  },
];

export default function GlowingBlobs() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className={blob.className}
          animate={shouldReduceMotion ? {} : blob.animate}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
