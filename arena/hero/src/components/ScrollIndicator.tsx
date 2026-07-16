import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function ScrollIndicator() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 0.6 }}
      aria-label="Scroll down"
    >
      <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
        Scroll
      </span>
      <motion.div
        animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </motion.div>
    </motion.div>
  );
}
