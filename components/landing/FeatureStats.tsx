'use client'

import React from 'react'
import { Building2, BarChart3, Shield, Brain } from 'lucide-react'
import { motion } from 'framer-motion'
import { MotionDiv, MotionSection, MotionCard } from '@/components/ui/motion'

const FeatureStats = () => {
  const stats = [
    {
      icon: Building2,
      number: '500+',
      label: 'Enterprise Clients',
      description: 'Organizations managing complex hierarchies'
    },
    {
      icon: BarChart3,
      number: '10M+',
      label: 'Reports Generated',
      description: 'Dynamic reports created monthly'
    },
    {
      icon: Shield,
      number: '99.9%',
      label: 'Security Uptime',
      description: 'Enterprise-grade reliability'
    },
    {
      icon: Brain,
      number: '85%',
      label: 'AI Accuracy',
      description: 'Document analysis precision'
    }
  ]

  return (
    <MotionSection className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <MotionDiv variant="fadeInUp" delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Trusted by Enterprise Leaders
            </h2>
          </MotionDiv>
          <MotionDiv variant="fadeInUp" delay={0.2}>
            <p className="text-xl text-foreground max-w-3xl mx-auto">
              Join hundreds of enterprises who have revolutionized their organizational management with our comprehensive platform
            </p>
          </MotionDiv>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <MotionCard
              key={index}
              delay={0.3 + index * 0.1}
              className="text-center p-6 card-hover"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-gradient-to-r from-primary to-accent">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <motion.div 
                className="text-3xl font-bold text-accent mb-2"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
              >
                {stat.number}
              </motion.div>
              <div className="text-lg font-semibold text-foreground mb-1">{stat.label}</div>
              <div className="text-foreground text-sm">{stat.description}</div>
            </MotionCard>
          ))}
        </div>
      </div>
    </MotionSection>
  )
}

export default FeatureStats