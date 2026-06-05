import type { Variants } from "framer-motion";

export const ease = [0.22, 1, 0.36, 1] as const;
export const easeOut = [0, 0, 0.2, 1] as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

export const slideInFromLeft: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.8, ease },
  },
};

export const heroTextVariants: Variants = {
  hidden: { opacity: 0, y: 60, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease },
  },
};

export const cardHover = {
  rest: { scale: 1, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
  hover: {
    scale: 1.02,
    boxShadow: "0 20px 60px rgba(0,182,122,0.2)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const buttonHover = {
  rest: { scale: 1 },
  hover: { scale: 1.03, transition: { duration: 0.2, ease: "easeOut" } },
  tap: { scale: 0.97 },
};

export const floatingAnimation = {
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const glowPulse = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(0, 182, 122, 0.2)",
      "0 0 40px rgba(0, 182, 122, 0.5)",
      "0 0 20px rgba(0, 182, 122, 0.2)",
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
