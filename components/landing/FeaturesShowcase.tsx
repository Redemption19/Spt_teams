'use client'

import React from 'react'
import { Building2, BarChart3, Users, FileText, Calendar, Shield, Brain, Layers } from 'lucide-react'

const FeaturesShowcase = () => {
  const features = [
    {
      icon: Layers,
      title: 'Multi-Workspace Management',
      description: 'Create main and sub-workspaces that perfectly mirror your enterprise structure with regions, branches, and departments.',
      color: 'bg-blue-500'
    },
    {
      icon: BarChart3,
      title: 'Advanced Reporting System',
      description: 'Build dynamic report templates, generate real-time analytics dashboards, and manage multi-stage approval workflows.',
      color: 'bg-green-500'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Smart invites, activity tracking, notification centers, and robust comment system connecting your teams effortlessly.',
      color: 'bg-purple-500'
    },
    {
      icon: FileText,
      title: 'Document Management & AI',
      description: 'Organize files with hierarchical folders, secure sharing, and leverage AI for document analysis and suggestions.',
      color: 'bg-orange-500'
    },
    {
      icon: Calendar,
      title: 'Integrated Calendar & Tasks',
      description: 'Centralize events, assign tasks with priorities, track deadlines, and visualize progress on Kanban boards.',
      color: 'bg-red-500'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Multi-factor authentication, data encryption, comprehensive audit logging, and advanced database management.',
      color: 'bg-indigo-500'
    },
    {
      icon: Brain,
      title: 'AI Integration',
      description: 'Google Gemini AI at the core providing advanced natural language processing and smart operational insights.',
      color: 'bg-pink-500'
    },
    {
      icon: Building2,
      title: 'Organizational Structure',
      description: 'Natively support complex hierarchies with regions, branches, departments, and multi-workspace management.',
      color: 'bg-teal-500'
    }
  ]

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 opacity-100">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Complete Enterprise Solution
          </h2>
          <p className="text-xl text-foreground max-w-3xl mx-auto">
            A unified platform consolidating tasks, reports, documents, and communications with comprehensive organizational management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className={`bg-card rounded-lg p-6 border border-border card-hover opacity-100`}>
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                {feature.title}
              </h3>
              <p className="text-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesShowcase