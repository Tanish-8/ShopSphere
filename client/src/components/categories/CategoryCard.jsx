import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Ripple } from './Ripple';
import { FloatingParticles } from './FloatingParticles';

export const CategoryCard = ({ name, image, count, icon: Icon, index, className }) => {
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  const handleMouseMove = (e) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Link
      to={`/products?category=${encodeURIComponent(name)}`}
      aria-label={`Browse ${name} category`}
      className={cn(
        'relative h-[280px] w-full rounded-3xl overflow-hidden group cursor-pointer perspective-1000 block',
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : index * 0.1 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          height: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.15),transparent_80%)]" />

        {/* Animated Border */}
        <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-white/20 to-transparent group-hover:from-white/40 group-hover:to-white/10 transition-all duration-500">
          <div className="absolute inset-0 rounded-3xl bg-black/20" />
        </div>

        {/* Main Content */}
        <div className="relative h-full w-full rounded-3xl overflow-hidden bg-zinc-900">
          {/* Image Background */}
          <img
            loading="lazy"
            src={image}
            alt={name}
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out',
              !shouldReduceMotion && 'group-hover:scale-110'
            )}
          />

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <FloatingParticles />

          {/* Card Content */}
          <div
            className="absolute inset-0 p-6 flex flex-col justify-end"
            style={{ transform: 'translateZ(20px)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors duration-300">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white/90 uppercase tracking-wider">
                {count.toLocaleString()} Products
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform duration-300">
                  {name}
                </h3>
                <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors duration-300">
                  Explore Collection
                </p>
              </div>

              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-black group-hover:scale-110 transition-all duration-300">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          <Ripple />
        </div>
      </motion.div>
    </Link>
  );
};
