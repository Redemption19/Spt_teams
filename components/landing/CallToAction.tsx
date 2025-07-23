'use client'

import React from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { MotionDiv, MotionButton } from '@/components/ui/motion'
import Link from 'next/link'

const CallToAction = () => {
  const benefits = [
    'Free 14-day trial',
    'No credit card required',
    'Cancel anytime',
    'Full feature access'
  ]

  return (
    <motion.section 
      className="py-20 bg-gradient-to-r from-primary/80 to-accent/80 dark:from-primary/60 dark:to-accent/60 rounded-2xl shadow-xl relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8 }}
    >
      {/* Dark overlay for better contrast in dark mode */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 rounded-2xl"></div>
      
      {/* Animated background elements */}
      <motion.div
        className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl"
        animate={{
          x: [0, -80, 0],
          y: [0, -30, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your{' '}
            <motion.span
              className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              Workflow?
            </motion.span>
          </h2>
        </MotionDiv>
        
        <MotionDiv variant="fadeInUp" delay={0.2}>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of teams who have already revolutionized their productivity with Workly. 
            Start your journey today.
          </p>
        </MotionDiv>

        <motion.div 
          className="flex flex-wrap justify-center gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, staggerChildren: 0.1 }}
        >
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index} 
              className="flex items-center space-x-2 text-white/90"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <CheckCircle className="w-5 h-5" />
              </motion.div>
              <span>{benefit}</span>
            </motion.div>
          ))}
        </motion.div>

        <MotionDiv variant="fadeInUp" delay={0.5}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <MotionButton className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:bg-white/30 transition-all duration-200 flex items-center space-x-2">
                <span>Start Free Trial</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight size={20} />
                </motion.div>
              </MotionButton>
            </Link>
            <Link href="/contact">
              <MotionButton className="border-2 border-white/60 text-white/90 px-8 py-4 rounded-lg font-semibold hover:bg-white/10 hover:border-white/80 transition-colors duration-200">
                Schedule Demo
              </MotionButton>
            </Link>
          </div>
        </MotionDiv>

        <MotionDiv variant="fadeInUp" delay={0.7}>
          <p className="text-white/70 text-sm mt-6">
            Trusted by{' '}
            <motion.span
              className="font-semibold text-white/90"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              50,000+
            </motion.span>
            {' '}professionals worldwide
          </p>
        </MotionDiv>
      </div>
    </motion.section>
  )
}

export default CallToAction