import { motion } from "framer-motion";
import { Truck, ShieldCheck, Headphones } from "lucide-react";

const badges = [
  {
    icon: <Truck className="h-4 w-4 text-violet-400" />,
    label: "Free Shipping",
  },
  {
    icon: <ShieldCheck className="h-4 w-4 text-violet-400" />,
    label: "Secure Payments",
  },
  {
    icon: <Headphones className="h-4 w-4 text-violet-400" />,
    label: "24/7 Support",
  },
];

export default function TrustBadges() {
  return (
    <motion.div
      className="flex flex-wrap items-center gap-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {badges.map((badge, i) => (
        <motion.div
          key={badge.label}
          custom={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm"
        >
          {badge.icon}
          <span className="text-xs font-medium tracking-wide text-slate-300">
            {badge.label}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
