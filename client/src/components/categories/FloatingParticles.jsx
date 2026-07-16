import { motion } from 'framer-motion';

export const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%',
            opacity: 0,
          }}
          animate={{
            y: [null, '-20%', '20%'],
            opacity: [0, 0.4, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
