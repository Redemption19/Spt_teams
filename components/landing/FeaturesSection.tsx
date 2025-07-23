'use client'

import React from 'react';
import { CheckSquare, Zap, Users, Target, BarChart3, Calendar, MessageCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { MotionDiv, MotionSection, MotionCard } from '@/components/ui/motion';
import CallToAction from '@/components/landing/CallToAction';

const features = [
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Organize and prioritize tasks efficiently for your team\'s success.',
    color: 'from-red-500 to-red-600'
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Stay informed with instant notifications on project progress.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Foster teamwork with integrated communication tools.',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Set and monitor project milestones and objectives easily.',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Gain insights with comprehensive project performance metrics.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Calendar,
    title: 'Resource Scheduling',
    description: 'Optimize resource allocation for maximum efficiency.',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: MessageCircle,
    title: 'Client Communication',
    description: 'Streamline client interactions within the project platform.',
    color: 'from-pink-500 to-pink-600'
  },
  {
    icon: FileText,
    title: 'Project Templates',
    description: 'Kickstart projects quickly with customizable templates.',
    color: 'from-gray-500 to-gray-600'
  }
];

const FeaturesSection = () => {
  return (
    <MotionSection className="max-w-7xl mx-auto py-20 px-4">
      {/* Header Section */}
      <div className="text-center mb-16">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Our Features
          </div>
        </MotionDiv>
        
        <MotionDiv variant="fadeInUp" delay={0.2}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            We do it for the love of the Game.{' '}
            <motion.span
              className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              (Managing Projects)
            </motion.span>
          </h1>
        </MotionDiv>
        
        <MotionDiv variant="fadeInUp" delay={0.3}>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Streamline your projects with our powerful features and gain insights with comprehensive project performance metrics.
          </p>
        </MotionDiv>
      </div>

      {/* Features Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
      >
        {features.map((feature, index) => (
          <MotionCard
            key={index}
            delay={index * 0.1}
            className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          >
            {/* Background hover effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Icon Container */}
            <motion.div 
              className={`relative w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}
              whileHover={{ 
                scale: 1.1,
                rotate: [0, -10, 10, 0],
                transition: { duration: 0.4 }
              }}
            >
              <feature.icon className="w-6 h-6 text-white" />
            </motion.div>
            
            {/* Content */}
            <div className="relative">
              <motion.h3 
                className="text-lg font-bold text-foreground mb-2"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {feature.title}
              </motion.h3>
              <motion.p 
                className="text-muted-foreground text-sm leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {feature.description}
              </motion.p>
            </div>
          </MotionCard>
        ))}
      </motion.div>

      {/* Call to Action at the end */}
      <MotionDiv variant="fadeInUp" delay={0.5}>
        <CallToAction />
      </MotionDiv>

      {/* Footer */}
      <MotionDiv variant="fadeInUp" delay={0.6}>
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            Workly offers comprehensive project management solutions for businesses of all sizes.
          </p>
        </div>
      </MotionDiv>
    </MotionSection>
  );
};

export default FeaturesSection; 