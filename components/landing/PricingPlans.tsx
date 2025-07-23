'use client'

import React from 'react'
import { Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { MotionDiv, MotionSection, MotionCard, MotionButton } from '@/components/ui/motion'

const PricingPlans = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$99',
      period: 'one-time payment',
      description: 'Perfect for small teams getting started',
      features: [
        { name: 'Up to 5 team members', included: true },
        { name: 'Basic project management', included: true },
        { name: 'File sharing (1GB)', included: true },
        { name: 'Email support', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Custom integrations', included: false },
        { name: 'Priority support', included: false },
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '$299',
      period: 'one-time payment',
      description: 'Best for growing teams and businesses',
      features: [
        { name: 'Up to 50 team members', included: true },
        { name: 'Advanced project management', included: true },
        { name: 'File sharing (100GB)', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Priority support', included: false },
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$999',
      period: 'one-time payment',
      description: 'For large organizations with advanced needs',
      features: [
        { name: 'Unlimited team members', included: true },
        { name: 'Enterprise project management', included: true },
        { name: 'Unlimited file sharing', included: true },
        { name: '24/7 phone & email support', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Priority support', included: true },
      ],
      popular: false
    }
  ]

  return (
    <MotionSection id="pricing" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <MotionDiv variant="fadeInUp" delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h2>
          </MotionDiv>
          <MotionDiv variant="fadeInUp" delay={0.2}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              One-time payment. Lifetime access. No subscriptions.
            </p>
          </MotionDiv>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <MotionCard
              key={index}
              delay={0.3 + index * 0.1}
              className={`relative bg-card rounded-lg p-8 border-2 ${
                plan.popular ? 'border-accent' : 'border-border'
              } card-hover`}
            >
              {plan.popular && (
                <motion.div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                >
                  <span className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </motion.div>
              )}
              
              <div className="text-center mb-8">
                <motion.h3 
                  className="text-2xl font-bold text-primary mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                >
                  {plan.name}
                </motion.h3>
                <motion.p 
                  className="text-muted-foreground mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                >
                  {plan.description}
                </motion.p>
                <motion.div 
                  className="flex items-baseline justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.7 + index * 0.1 }}
                >
                  <span className="text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {plan.period}
                  </span>
                </motion.div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <motion.li 
                    key={featureIndex} 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 + featureIndex * 0.05 }}
                  >
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    )}
                    <span className={`${
                      feature.included ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {feature.name}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <MotionButton className={`w-full py-3 rounded-lg font-semibold transition-colors duration-200 mt-auto ${
                plan.popular
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:opacity-90'
                  : 'border-2 border-accent text-accent bg-white hover:bg-accent/10'
              }`}>
                Get Started
              </MotionButton>
            </MotionCard>
          ))}
        </div>

        <MotionDiv variant="fadeInUp" delay={0.8}>
          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              All plans include a 30-day money-back guarantee. Lifetime updates included.
            </p>
          </div>
        </MotionDiv>
      </div>
    </MotionSection>
  )
}

export default PricingPlans