'use client'

import React from 'react';
import { Check, Star, Zap, Shield, Users, BarChart3, FileText, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { MotionDiv, MotionSection, MotionCard, MotionButton } from '@/components/ui/motion';
import Link from 'next/link';

const plans = [
  { 
    name: 'Starter', 
    price: '$299', 
    originalPrice: '$399',
    description: 'Perfect for small teams getting started',
    features: [
      'Up to 10 team members',
      'Basic project management',
      'File sharing (5GB)',
      'Email support',
      'Basic reporting',
      'Standard security'
    ],
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    popular: false
  },
  { 
    name: 'Professional', 
    price: '$799', 
    originalPrice: '$999',
    description: 'Ideal for growing organizations',
    features: [
      'Up to 100 team members',
      'Advanced project management',
      'File sharing (50GB)',
      'Priority email support',
      'Advanced analytics & reporting',
      'Custom integrations',
      'Enhanced security',
      'Multi-workspace support'
    ],
    icon: Zap,
    color: 'from-primary to-accent',
    popular: true
  },
  { 
    name: 'Enterprise', 
    price: '$1,999', 
    originalPrice: '$2,499',
    description: 'For large organizations with complex needs',
    features: [
      'Unlimited team members',
      'Enterprise project management',
      'Unlimited file sharing',
      '24/7 priority support',
      'Advanced analytics & AI insights',
      'Custom integrations & API access',
      'Enterprise security & compliance',
      'Multi-workspace hierarchy',
      'White-label options',
      'Dedicated account manager'
    ],
    icon: Shield,
    color: 'from-purple-500 to-purple-600',
    popular: false
  },
];

const PricingSection = () => (
  <MotionSection className="max-w-7xl mx-auto py-20 px-4">
    {/* Header Section */}
    <div className="text-center mb-16">
      <MotionDiv variant="fadeInUp" delay={0.1}>
        <div className="inline-block px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
          Pricing
        </div>
      </MotionDiv>
      
      <MotionDiv variant="fadeInUp" delay={0.2}>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          Simple, Transparent{' '}
          <motion.span
            className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Pricing
          </motion.span>
        </h1>
      </MotionDiv>
      
      <MotionDiv variant="fadeInUp" delay={0.3}>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          One-time payment. No hidden fees. No recurring charges. Get everything you need to transform your organization&apos;s workflow.
        </p>
      </MotionDiv>
    </div>

    {/* Pricing Cards */}
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ staggerChildren: 0.2, delayChildren: 0.2 }}
    >
      {plans.map((plan, idx) => (
        <MotionCard
          key={idx}
          delay={idx * 0.2}
          className={`bg-card rounded-xl p-8 shadow-lg border border-border flex flex-col relative overflow-hidden ${
            plan.popular ? 'ring-2 ring-primary/50 shadow-xl' : ''
          }`}
        >
          {/* Popular Badge */}
          {plan.popular && (
            <motion.div 
              className="absolute -top-4 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div 
                className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                animate={{ boxShadow: ["0 0 20px rgba(0,0,0,0.1)", "0 0 30px rgba(0,0,0,0.2)", "0 0 20px rgba(0,0,0,0.1)"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-4 h-4" />
                </motion.div>
                Most Popular
              </motion.div>
            </motion.div>
          )}

          {/* Plan Icon */}
          <motion.div 
            className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mb-6`}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ 
              scale: 1.1,
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.4 }
            }}
          >
            <plan.icon className="w-8 h-8 text-white" />
          </motion.div>

          {/* Plan Details */}
          <motion.h3 
            className="text-2xl font-bold text-foreground mb-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {plan.name}
          </motion.h3>
          
          <motion.p 
            className="text-muted-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {plan.description}
          </motion.p>
          
          {/* Pricing */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-baseline gap-2">
              <motion.span 
                className="text-4xl font-extrabold text-primary"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {plan.price}
              </motion.span>
              <span className="text-lg text-muted-foreground line-through">{plan.originalPrice}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">One-time payment</p>
          </motion.div>

          {/* Features */}
          <motion.ul 
            className="mb-8 space-y-3 flex-1"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6, staggerChildren: 0.1 }}
          >
            {plan.features.map((feature, i) => (
              <motion.li 
                key={i} 
                className="text-foreground text-base flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                >
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                </motion.div>
                <span>{feature}</span>
              </motion.li>
            ))}
          </motion.ul>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Link href={plan.popular ? "/dashboard" : "/contact"}>
              <MotionButton className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                plan.popular 
                  ? 'bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-lg' 
                  : 'bg-card border-2 border-primary text-primary hover:bg-primary hover:text-white'
              }`}>
                {plan.popular ? 'Get Started Now' : 'Contact Sales'}
              </MotionButton>
            </Link>
          </motion.div>
        </MotionCard>
      ))}
    </motion.div>

    {/* Additional Info */}
    <MotionDiv variant="fadeInUp" delay={0.5}>
      <div className="text-center space-y-6">
        <motion.div 
          className="bg-card rounded-xl p-8 border border-border"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
        >
          <motion.h3 
            className="text-2xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            What&apos;s Included in All Plans
          </motion.h3>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3, staggerChildren: 0.1 }}
          >
            {[
              { icon: Globe, text: 'Cloud hosting' },
              { icon: Shield, text: 'Data encryption' },
              { icon: BarChart3, text: 'Regular updates' },
              { icon: FileText, text: 'Documentation' }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: idx * 0.5 }}
                >
                  <item.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <span className="text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.p 
          className="text-muted-foreground text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          All plans include a 30-day money-back guarantee. Need a custom solution? <span className="text-primary cursor-pointer hover:underline">Contact us</span>.
        </motion.p>
      </div>
    </MotionDiv>
  </MotionSection>
);

export default PricingSection; 