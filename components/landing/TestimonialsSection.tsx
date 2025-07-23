'use client'

import React from 'react';
import { Star, Quote, Users, TrendingUp, Award, Globe } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { MotionDiv, MotionSection, MotionCard, MotionButton } from '@/components/ui/motion';
import Link from 'next/link';

const testimonials = [
  { 
    name: 'Sarah Johnson', 
    role: 'Product Manager', 
    company: 'TechFlow Inc.',
    avatar: '/images/testimonials/sarah.jpg', 
    quote: 'Workly has completely transformed how our team manages projects. The unified platform approach eliminated our need for multiple tools, and the reporting capabilities are game-changing. Our productivity increased by 40% in just the first month.',
    rating: 5,
    industry: 'Technology'
  },
  { 
    name: 'Michael Chen', 
    role: 'Engineering Lead', 
    company: 'InnovateCorp',
    avatar: '/images/testimonials/michael.jpg', 
    quote: 'The best project management tool we have ever used. The multi-workspace hierarchy perfectly mirrors our organizational structure, and the AI-powered insights help us make data-driven decisions that actually matter.',
    rating: 5,
    industry: 'Engineering'
  },
  { 
    name: 'Emily Rodriguez', 
    role: 'Creative Director', 
    company: 'Design Studio Pro',
    avatar: '/images/testimonials/emily.jpg', 
    quote: 'Workly strikes the perfect balance between simplicity and functionality. Our creative team loves how easy it is to track progress, collaborate on files, and generate reports. It\'s become our single source of truth.',
    rating: 5,
    industry: 'Creative'
  },
  { 
    name: 'David Thompson', 
    role: 'Operations Manager', 
    company: 'Global Solutions Ltd.',
    avatar: '/images/testimonials/david.jpg', 
    quote: 'The organizational management features are exactly what we needed. Managing regions, branches, and departments has never been easier. The approval workflows have streamlined our entire process.',
    rating: 5,
    industry: 'Consulting'
  },
  { 
    name: 'Lisa Wang', 
    role: 'HR Director', 
    company: 'FutureWorks',
    avatar: '/images/testimonials/lisa.jpg', 
    quote: 'As an HR professional, I appreciate how Workly handles team management and permissions. The role-based access control is intuitive, and the reporting helps us track team performance effectively.',
    rating: 5,
    industry: 'Human Resources'
  },
  { 
    name: 'James Wilson', 
    role: 'CEO', 
    company: 'StartupHub',
    avatar: '/images/testimonials/james.jpg', 
    quote: 'We tried multiple tools before finding Workly. The one-time payment model was refreshing, and the platform delivers everything we need. It\'s like having a dedicated project management team.',
    rating: 5,
    industry: 'Startup'
  }
];

const stats = [
  { number: '5K+', label: 'Active Users', icon: Users },
  { number: '98%', label: 'Satisfaction Rate', icon: TrendingUp },
  { number: '2+', label: 'Countries', icon: Globe },
  { number: '4.9/5', label: 'Average Rating', icon: Award }
];

const TestimonialsSection = () => {
  return (
    <MotionSection className="max-w-7xl mx-auto py-20 px-4">
      {/* Header Section */}
      <div className="text-center mb-16">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Testimonials
          </div>
        </MotionDiv>
        
        <MotionDiv variant="fadeInUp" delay={0.2}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Trusted by Teams{' '}
            <motion.span
              className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              Worldwide
            </motion.span>
          </h1>
        </MotionDiv>
        
        <MotionDiv variant="fadeInUp" delay={0.3}>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            See how organizations across different industries are transforming their workflows with Workly&apos;s unified platform.
          </p>
        </MotionDiv>
      </div>

      {/* Stats Section */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
      >
        {stats.map((stat, index) => (
          <MotionCard 
            key={index}
            delay={index * 0.1}
            className="bg-card rounded-xl p-6 text-center border border-border hover:shadow-lg transition duration-300"
          >
            <motion.div 
              className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center mx-auto mb-4"
              whileHover={{ 
                scale: 1.1,
                rotate: [0, -10, 10, 0],
                transition: { duration: 0.4 }
              }}
            >
              <stat.icon className="w-6 h-6 text-white" />
            </motion.div>
            
            <motion.div 
              className="text-2xl font-bold text-primary mb-1"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              animate={{ 
                textShadow: ["0 0 10px rgba(0,0,0,0)", "0 0 20px rgba(0,0,0,0.1)", "0 0 10px rgba(0,0,0,0)"]
              }}
              style={{
                animationDelay: `${index * 0.2}s`
              }}
            >
              {stat.number}
            </motion.div>
            
            <motion.div 
              className="text-muted-foreground text-sm"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {stat.label}
            </motion.div>
          </MotionCard>
        ))}
      </motion.div>

      {/* Testimonials Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ staggerChildren: 0.15, delayChildren: 0.3 }}
      >
        {testimonials.map((testimonial, idx) => (
          <MotionCard 
            key={idx}
            delay={idx * 0.15}
            className="bg-card rounded-xl p-8 shadow-lg border border-border hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
          >
            {/* Background gradient on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Quote Icon */}
            <motion.div 
              className="relative w-12 h-12 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg flex items-center justify-center mb-6"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ rotate: 15, scale: 1.1 }}
            >
              <Quote className="w-6 h-6 text-primary" />
            </motion.div>

            {/* Rating */}
            <motion.div 
              className="relative flex items-center gap-1 mb-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {[...Array(testimonial.rating)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                  whileHover={{ scale: 1.2, rotate: 360 }}
                >
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </motion.div>
              ))}
            </motion.div>

            {/* Quote */}
            <motion.blockquote 
              className="relative text-foreground mb-6 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              &ldquo;{testimonial.quote}&rdquo;
            </motion.blockquote>

            {/* Author Info */}
            <motion.div 
              className="relative flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-white font-semibold text-sm">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </span>
              </motion.div>
              <div>
                <motion.div 
                  className="font-semibold text-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  {testimonial.name}
                </motion.div>
                <motion.div 
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  {testimonial.role}
                </motion.div>
                <motion.div 
                  className="text-xs text-primary font-medium"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                >
                  {testimonial.company}
                </motion.div>
              </div>
            </motion.div>

            {/* Industry Badge */}
            <motion.div 
              className="relative mt-4"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <motion.span 
                className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--primary) / 0.2)" }}
                transition={{ duration: 0.2 }}
              >
                {testimonial.industry}
              </motion.span>
            </motion.div>
          </MotionCard>
        ))}
      </motion.div>

      {/* Call to Action */}
      <MotionDiv variant="fadeInUp" delay={0.5}>
        <div className="text-center">
          <motion.div 
            className="bg-card rounded-2xl p-8 border border-border max-w-4xl mx-auto relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
          >
            {/* Background animated elements */}
            <motion.div
              className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <motion.h3 
              className="relative text-2xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Ready to Join Our Success Stories?
            </motion.h3>
            
            <motion.p 
              className="relative text-muted-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Join thousands of teams who have already transformed their workflow with Workly.
            </motion.p>
            
            <motion.div 
              className="relative flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/register">
                <MotionButton className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity duration-200">
                  Start Free Trial
                </MotionButton>
              </Link>
              <Link href="/contact">
                <MotionButton className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors duration-200">
                  Schedule Demo
                </MotionButton>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </MotionDiv>
    </MotionSection>
  );
};

export default TestimonialsSection; 