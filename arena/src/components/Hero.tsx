import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import GlowingBlobs from "./GlowingBlobs";
import HeroHeadline from "./HeroHeadline";
import CTAButton from "./CTAButton";
import TrustBadges from "./TrustBadge";
import AnimatedStats from "./AnimatedStats";
import ProductShowcase from "./ProductShowcase";
import ScrollIndicator from "./ScrollIndicator";

function SectionLabel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" aria-hidden="true" />
      <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
        New Season Drop — Summer 2025
      </span>
    </motion.div>
  );
}

function SupportingText() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.6 }}
      className="max-w-md text-base leading-relaxed text-slate-400 sm:text-lg"
    >
      Discover curated collections from the world's top brands. Premium quality,
      lightning-fast delivery, and an experience that feels nothing short of
      extraordinary.
    </motion.p>
  );
}

function CTAGroup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="flex flex-wrap items-center gap-3"
    >
      <CTAButton variant="primary" icon="arrow">
        Shop Now
      </CTAButton>
      <CTAButton variant="secondary" icon="zap">
        Explore Deals
      </CTAButton>
    </motion.div>
  );
}

function GridLines() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Subtle dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Diagonal accent line */}
      <div
        className="absolute -left-20 top-1/3 h-px w-64 -rotate-12 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"
      />
      <div
        className="absolute right-1/4 bottom-1/3 h-px w-48 rotate-12 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"
      />
    </div>
  );
}

function GradientOverlays() {
  return (
    <>
      {/* Top vignette */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0a12] to-transparent"
        aria-hidden="true"
      />
      {/* Bottom vignette */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a12] to-transparent"
        aria-hidden="true"
      />
    </>
  );
}

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const leftY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -60]);
  const leftOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const rightY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -40]);
  const rightOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-[#0a0a12]"
      aria-label="ShopSphere hero section"
    >
      {/* Background */}
      <GlowingBlobs />
      <GridLines />
      <GradientOverlays />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
        <div className="flex min-h-[calc(100vh-7rem)] flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-8">

          {/* ─── LEFT COLUMN ─── */}
          <motion.div
            style={{ y: leftY, opacity: leftOpacity }}
            className="flex flex-1 flex-col gap-8 lg:max-w-xl xl:max-w-2xl"
          >
            <SectionLabel />

            {/* Headline */}
            <HeroHeadline />

            {/* Supporting text */}
            <SupportingText />

            {/* CTA buttons */}
            <CTAGroup />

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <TrustBadges />
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="h-px w-48 origin-left bg-gradient-to-r from-violet-500/40 to-transparent"
              aria-hidden="true"
            />

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <AnimatedStats />
            </motion.div>
          </motion.div>

          {/* ─── RIGHT COLUMN ─── */}
          <motion.div
            style={{ y: rightY, opacity: rightOpacity }}
            className="relative h-[520px] w-full flex-1 lg:h-[600px]"
          >
            <ProductShowcase />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center pb-8">
          <ScrollIndicator />
        </div>
      </div>
    </section>
  );
}
