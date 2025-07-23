'use client'

import React from 'react'
import { Play, ArrowRight, Zap, BarChart3, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { MotionDiv, MotionButton } from '@/components/ui/motion'
import Link from 'next/link'

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center hero-pattern overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Hero Content */}
          <div className="max-w-4xl mx-auto mb-12">
            <MotionDiv variant="fadeInUp" delay={0.2}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                The Complete Enterprise
                <br />
                <motion.span 
                  className="block text-5xl font-extrabold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  Workspace Management Platform
                </motion.span>
              </h1>
            </MotionDiv>

            <MotionDiv variant="fadeInUp" delay={0.4}>
              <p className="text-xl text-foreground mb-8 max-w-3xl mx-auto">
                Unify tasks, reports, documents, and communications in one powerful platform. 
                Manage complex organizational hierarchies with AI-powered insights and enterprise-grade security.
              </p>
            </MotionDiv>
            
            {/* CTA Buttons */}
            <MotionDiv variant="fadeInUp" delay={0.6}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link href="/register">
                  <MotionButton className="bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-opacity duration-200 flex items-center space-x-2">
                    <span>Start Free Trial</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight size={20} />
                    </motion.div>
                  </MotionButton>
                </Link>
                <MotionButton className="border-2 border-accent text-accent px-8 py-4 rounded-lg font-semibold hover:bg-accent/10 transition-colors duration-200 flex items-center space-x-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Play size={20} />
                  </motion.div>
                  <span>Watch Demo</span>
                </MotionButton>
              </div>
            </MotionDiv>

            {/* Key Features Preview */}
            <motion.div 
              className="flex flex-wrap justify-center gap-6 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, staggerChildren: 0.1 }}
            >
              <motion.div 
                className="flex items-center space-x-2 text-muted-foreground"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                whileHover={{ scale: 1.05, color: "hsl(var(--primary))" }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-5 h-5 text-primary" />
                </motion.div>
                <span>Multi-Workspace Management</span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-2 text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                whileHover={{ scale: 1.05, color: "hsl(var(--primary))" }}
              >
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <BarChart3 className="w-5 h-5 text-primary" />
                </motion.div>
                <span>Advanced Reporting</span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-2 text-muted-foreground"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                whileHover={{ scale: 1.05, color: "hsl(var(--primary))" }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Shield className="w-5 h-5 text-primary" />
                </motion.div>
                <span>Enterprise Security</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Hero Illustration with dark overlay and border */}
          <MotionDiv variant="fadeInUp" delay={1.0}>
            <div className="relative max-w-4xl mx-auto mt-8">
              <motion.img
                src="/images/system-screen/dash-screenshort.png"
                alt="Dashboard Screenshot"
                className="w-full rounded-2xl shadow-2xl border border-border object-cover"
                loading="lazy"
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 1.2, ease: "easeOut" }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  transition: { duration: 0.3 }
                }}
              />
              {/* Dark overlay for better contrast in dark mode */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none dark:bg-black/30"></div>
              
              {/* Floating elements around the image */}
              <motion.div
                className="absolute -top-4 -left-4 w-8 h-8 bg-primary/20 rounded-full blur-sm"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-4 -right-4 w-6 h-6 bg-accent/20 rounded-full blur-sm"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              <motion.div
                className="absolute top-1/4 -right-8 w-4 h-4 bg-primary/30 rounded-full blur-sm"
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
            </div>
          </MotionDiv>
        </div>
      </div>
      
      {/* Background animated elements */}
      <motion.div
        className="absolute top-1/4 left-10 w-2 h-2 bg-primary/20 rounded-full"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.7, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-10 w-3 h-3 bg-accent/20 rounded-full"
        animate={{
          y: [0, 15, 0],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </section>
  )
}

export default HeroSection