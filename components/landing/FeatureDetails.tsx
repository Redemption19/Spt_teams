'use client'

import React from 'react'
import { CheckCircle, ArrowRight, Zap, Brain, Shield, BarChart3, Users, Calendar } from 'lucide-react'

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
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="opacity-100">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-accent mb-4">The Problem</h3>
              <p className="text-foreground mb-4">
                Many platforms are just task managers, completely neglecting robust reporting and organizational structure management.
              </p>
              <ul className="space-y-2">
                {problemPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-2 text-accent">
                    <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Our Integrated Solution
            </h2>
            <p className="text-xl text-foreground mb-8">
              A unified platform that consolidates everything your enterprise needs - from task management to complex organizational hierarchies, all powered by AI.
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className={`flex items-center space-x-3 opacity-100`}>
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <button className="bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-opacity duration-200 flex items-center space-x-2">
              <span>Explore Features</span>
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Right Visual */}
          <div className="relative opacity-100">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="space-y-6">
                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">Dynamic Reports</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Real-time analytics with customizable templates
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">AI Intelligence</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Google Gemini AI for smart insights and analysis
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">Enterprise Security</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Multi-factor authentication, encryption, and comprehensive audit logging
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">Collaboration Tools</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Real-time chat, comments, and notifications for seamless teamwork
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">Custom Workflows</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Automate processes and approvals with flexible workflow builder
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-border sm:col-span-2">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-foreground">Calendar Management</span>
                    </div>
                    <p className="text-sm text-foreground">
                      Centralized scheduling, event tracking, and deadline management for your teams
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeatureDetails