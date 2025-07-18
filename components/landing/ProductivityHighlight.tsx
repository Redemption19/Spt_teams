'use client'

import React from 'react'
import { TrendingUp, Clock, Target, Users, Building2, Shield, Brain, BarChart3 } from 'lucide-react'

const ProductivityHighlight = () => {
  const metrics = [
    {
      icon: Building2,
      value: '85%',
      label: 'Organizational Efficiency',
      description: 'Improvement in multi-workspace management'
    },
    {
      icon: Clock,
      value: '60%',
      label: 'Reporting Time Reduced',
      description: 'Faster report generation with AI assistance'
    },
    {
      icon: Shield,
      value: '99.9%',
      label: 'Security Compliance',
      description: 'Enterprise-grade security standards met'
    },
    {
      icon: Brain,
      value: '40%',
      label: 'AI-Enhanced Insights',
      description: 'Better decision making with AI analytics'
    }
  ]

  return (
    <section className="py-20 gradient-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Productivity Highlights
          </h2>
          <p className="text-xl text-foreground max-w-3xl mx-auto">
            See how our platform drives measurable results for organizations of all sizes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <div key={index} className={`text-center opacity-100`}>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg mb-4">
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-accent mb-2">{metric.value}</div>
              <div className="text-lg font-semibold text-foreground mb-1">{metric.label}</div>
              <div className="text-foreground text-sm">{metric.description}</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 opacity-100">
          <button className="bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-opacity duration-200">
            Start Your Free Trial
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProductivityHighlight