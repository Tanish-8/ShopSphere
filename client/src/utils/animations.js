// Common animation configurations for Framer Motion

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

export const slideInFromBottom = {
  hidden: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: {
    duration: 0.3,
    ease: [0.33, 1, 0.68, 1]
  }
};

export const heartPop = {
  scale: [1, 1.4, 1],
  rotate: [0, 15, -15, 0],
  transition: {
    duration: 0.4
  }
};

export const hoverScale = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: [0.33, 1, 0.68, 1]
  }
};

export const tapScale = {
  scale: 0.95,
  transition: {
    duration: 0.1
  }
};

export const imageZoom = {
  scale: 1.08,
  transition: {
    duration: 0.6,
    ease: [0.33, 1, 0.68, 1]
  }
};

export const viewportConfig = {
  once: true,
  margin: "-100px"
};

export const viewportConfigOnce = {
  once: true
};
