import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Shield, Package, Headphones, Star, Globe } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const features = [
  {
    icon: Zap,
    title: "Lightning Delivery",
    description: "Same-day delivery available in 50+ cities. Track your order in real time.",
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/25",
  },
  {
    icon: Shield,
    title: "Buyer Protection",
    description: "Every purchase is fully protected. 30-day hassle-free returns guaranteed.",
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/25",
  },
  {
    icon: Package,
    title: "Premium Packaging",
    description: "Eco-friendly, luxury packaging. Your order arrives presentation-ready.",
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/25",
  },
  {
    icon: Headphones,
    title: "Concierge Support",
    description: "Dedicated personal shoppers available 24/7 via chat, call, or email.",
    gradient: "from-sky-500 to-indigo-500",
    glow: "shadow-sky-500/25",
  },
  {
    icon: Star,
    title: "Loyalty Rewards",
    description: "Earn SpherePoints on every purchase. Unlock exclusive member benefits.",
    gradient: "from-pink-500 to-rose-500",
    glow: "shadow-pink-500/25",
  },
  {
    icon: Globe,
    title: "Worldwide Access",
    description: "Shop from 180+ countries. Multiple currencies and languages supported.",
    gradient: "from-teal-500 to-cyan-500",
    glow: "shadow-teal-500/25",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm transition-shadow hover:border-white/[0.15] hover:bg-white/[0.06]"
    >
      {/* Hover gradient shimmer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.glow}`}
      >
        <feature.icon className="h-5 w-5 text-white" />
      </div>

      <h3 className="mb-2 text-base font-semibold text-white">{feature.title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section
      className="relative bg-[#0a0a12] px-4 py-24 sm:px-6 lg:px-8"
      aria-label="ShopSphere features"
    >
      {/* Section divider */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <ScrollReveal delay={0}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                Why ShopSphere
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Built for the{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                modern shopper
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
              Every feature was crafted to make your shopping experience faster,
              safer, and more enjoyable than anywhere else.
            </p>
          </ScrollReveal>
        </div>

        {/* Feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
