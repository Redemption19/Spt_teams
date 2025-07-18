'use client'

import React from 'react'
import { Check, X } from 'lucide-react'

const PricingPlans = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$9',
      period: 'per user/month',
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
      price: '$29',
      period: 'per user/month',
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
      price: '$99',
      period: 'per user/month',
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
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`relative bg-card rounded-lg p-8 border-2 ${
              plan.popular ? 'border-accent' : 'border-border'
            } card-hover`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-primary mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-primary">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
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
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 rounded-lg font-semibold transition-colors duration-200 mt-auto ${
                plan.popular
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:opacity-90'
                  : 'border-2 border-accent text-accent bg-white hover:bg-accent/10'
              }`}>
                Get Started
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}

export default PricingPlans