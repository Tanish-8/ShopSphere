import { motion, useReducedMotion } from "framer-motion";

export default function HeroHeadline() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-gray-900 dark:text-white lg:text-6xl xl:text-7xl">
        Everything You Love.{" "}
        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Delivered Faster.
        </span>
      </h1>
    );
  }

  return (
    <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-gray-900 dark:text-white lg:text-6xl xl:text-7xl">
      <span className="flex flex-wrap gap-x-4">
        {["Everything", "You", "Love."].map((word, i) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: i * 0.12,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
            }}
            className="inline-block text-gray-900 dark:text-white"
          >
            {word}
          </motion.span>
        ))}
      </span>
      <span className="flex flex-wrap gap-x-4">
        {["Delivered", "Faster."].map((word, i) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: (i + 3) * 0.12,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
            }}
            className="inline-block bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent"
          >
            {word}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}
