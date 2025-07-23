'use client'

import React from 'react'
import { CheckCircle, ArrowRight, Zap, Brain, Shield, BarChart3, Users, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { MotionDiv, MotionSection, MotionCard, MotionButton } from '@/components/ui/motion'

const FeatureDetails = () => {
  const features = [
    'Multi-workspace hierarchical structure',
    'Dynamic report templates & analytics',
    'AI-powered document analysis',
    'Enterprise-grade security & compliance',
    'Real-time collaboration & notifications',
    'Integrated calendar & task management'
  ]

  const problemPoints = [
    'Fragmented tools for tasks, reports, and organization',
    'No support for complex organizational hierarchies',
    'Lack of dynamic reporting capabilities',
    'Missing single source of truth',
    'Poor integration between systems'
  ]

  return (
    <MotionSection className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <MotionDiv variant="fadeInLeft" delay={0.1}>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-accent mb-4">The Problem</h3>
              <p className="text-foreground mb-4">
                Many platforms are just task managers, completely neglecting robust reporting and organizational structure management.
              </p>
              <ul className="space-y-2">
                {problemPoints.map((point, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-start space-x-2 text-accent"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  >
                    <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></span>
                    <span>{point}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-primary mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Our Integrated Solution
            </motion.h2>
            <motion.p 
              className="text-xl text-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              A unified platform that consolidates everything your enterprise needs - from task management to complex organizational hierarchies, all powered by AI.
            </motion.p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                >
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>

            <MotionButton className="bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-opacity duration-200 flex items-center space-x-2">
              <span>Explore Features</span>
              <ArrowRight size={20} />
            </MotionButton>
          </MotionDiv>

          {/* Right Visual */}
          <MotionDiv variant="fadeInRight" delay={0.3}>
            <div className="rounded-2xl p-8 border border-border shadow-2xl bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="space-y-6">
                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MotionCard
                    delay={0.4}
                    className="bg-card rounded-lg p-4 shadow-xl border border-border transition duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-3xl"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">Dynamic Reports</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Real-time analytics with customizable templates
                    </p>
                  </MotionCard>

                  <MotionCard
                    delay={0.5}
                    className="bg-card rounded-lg p-4 shadow-xl border border-border transition duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-3xl"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">AI Intelligence</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Google Gemini AI for smart insights and analysis
                    </p>
                  </MotionCard>

                  <MotionCard
                    delay={0.6}
                    className="bg-card rounded-lg p-4 shadow-xl border border-border transition duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-3xl"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">Enterprise Security</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Multi-factor authentication, encryption, and comprehensive audit logging
                    </p>
                  </MotionCard>

                  <MotionCard
                    delay={0.7}
                    className="bg-card rounded-lg p-4 shadow-xl border border-border transition duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-3xl"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">Collaboration Tools</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Real-time chat, comments, and notifications for seamless teamwork
                    </p>
                  </MotionCard>

                  <MotionCard
                    delay={0.8}
                    className="bg-card rounded-lg p-4 shadow-xl border border-border transition duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-3xl"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">Custom Workflows</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Automate processes and approvals with flexible workflow builder
                    </p>
                  </MotionCard>

                  <MotionCard
                    delay={0.9}
                    className="bg-card rounded-lg p-4 shadow-xl border border-border sm:col-span-2 transition duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-3xl"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">Calendar Management</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Centralized scheduling, event tracking, and deadline management for your teams
                    </p>
                  </MotionCard>
                </div>
              </div>
            </div>
          </MotionDiv>
        </div>
      </div>
    </MotionSection>
  )
} 

export default FeatureDetails