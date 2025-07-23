'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

// Animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const }
}

export const fadeInDown = {
  initial: { opacity: 0, y: -60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const }
}

export const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const }
}

export const fadeInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.8, ease: "easeOut" as const }
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const }
}

// Reusable motion components
interface MotionDivProps {
  children: ReactNode
  className?: string
  delay?: number
  variant?: 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn'
}

export const MotionDiv = ({ 
  children, 
  className = '', 
  delay = 0, 
  variant = 'fadeInUp' 
}: MotionDivProps) => {
  const variants = {
    fadeInUp,
    fadeInDown,
    fadeInLeft,
    fadeInRight,
    scaleIn
  }

  const selectedVariant = variants[variant]
  
  return (
    <motion.div
      className={className}
      initial={selectedVariant.initial}
      whileInView={selectedVariant.animate}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: selectedVariant.transition.duration, 
        ease: selectedVariant.transition.ease,
        delay 
      }}
    >
      {children}
    </motion.div>
  )
}

// Section wrapper with stagger animation
export const MotionSection = ({ 
  children, 
  className = '',
  delay = 0,
  ...props
}: { 
  children: ReactNode
  className?: string
  delay?: number 
  [key: string]: any
}) => (
  <motion.section
    className={className}
    initial="initial"
    whileInView="animate"
    viewport={{ once: true, margin: "-100px" }}
    variants={staggerContainer}
    transition={{ delay }}
    {...props}
  >
    {children}
  </motion.section>
)

// Card hover animation
export const MotionCard = ({ 
  children, 
  className = '',
  delay = 0 
}: { 
  children: ReactNode
  className?: string
  delay?: number 
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={{ 
      y: -10, 
      transition: { duration: 0.3, ease: "easeOut" }
    }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ 
      duration: 0.6, 
      delay,
      ease: "easeOut" as const
    }}
  >
    {children}
  </motion.div>
)

// Button hover animation
export const MotionButton = ({ 
  children, 
  className = '',
  ...props 
}: { 
  children: ReactNode
  className?: string
  [key: string]: any
}) => (
  <motion.button
    className={className}
    whileHover={{ 
      scale: 1.05,
      transition: { duration: 0.2 }
    }}
    whileTap={{ scale: 0.95 }}
    {...props}
  >
    {children}
  </motion.button>
)

// Text reveal animation
export const MotionText = ({ 
  children, 
  className = '',
  delay = 0 
}: { 
  children: ReactNode
  className?: string
  delay?: number 
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ 
      duration: 0.8, 
      delay,
      ease: "easeOut" as const
    }}
  >
    {children}
  </motion.div>
)
