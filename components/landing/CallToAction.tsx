'use client'

import React from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'

const CallToAction = () => {
  const benefits = [
    'Free 14-day trial',
    'No credit card required',
    'Cancel anytime',
    'Full feature access'
  ]

  return (
    <section className="py-20 gradient-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
          Ready to Transform Your Workflow?
        </h2>
        <p className="text-xl text-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of teams who have already revolutionized their productivity with Workly. 
          Start your journey today.
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-8 opacity-100">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-2 text-accent">
              <CheckCircle className="w-5 h-5" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-opacity duration-200 flex items-center space-x-2">
            <span>Start Free Trial</span>
            <ArrowRight size={20} />
          </button>
          <button className="border-2 border-accent text-accent px-8 py-4 rounded-lg font-semibold hover:bg-accent/10 transition-colors duration-200">
            Schedule Demo
          </button>
        </div>

        <p className="text-accent text-sm mt-6">
          Trusted by 50,000+ professionals worldwide
        </p>
      </div>
    </section>
  )
}

export default CallToAction