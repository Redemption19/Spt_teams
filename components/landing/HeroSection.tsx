'use client'

import React from 'react'
import { Play, ArrowRight, Users, Calendar, CheckCircle, Zap, BarChart3, Shield } from 'lucide-react'

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center hero-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center opacity-100">
          {/* Hero Content */}
          <div className="max-w-4xl mx-auto mb-12 opacity-100">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              The Complete Enterprise
              <br />
              <span className="block text-5xl font-extrabold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Workspace Management Platform
              </span>
            </h1>
            <p className="text-xl text-foreground mb-8 max-w-3xl mx-auto opacity-100">
              Unify tasks, reports, documents, and communications in one powerful platform. 
              Manage complex organizational hierarchies with AI-powered insights and enterprise-grade security.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 opacity-100">
              <button className="bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-opacity duration-200 flex items-center space-x-2">
                <span>Start Free Trial</span>
                <ArrowRight size={20} />
              </button>
              <button className="border-2 border-accent text-accent px-8 py-4 rounded-lg font-semibold hover:bg-accent/10 transition-colors duration-200 flex items-center space-x-2">
                <Play size={20} />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Key Features Preview */}
            <div className="flex flex-wrap justify-center gap-6 mb-12 opacity-100">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Zap className="w-5 h-5 text-primary" />
                <span>Multi-Workspace Management</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span>Advanced Reporting</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Shield className="w-5 h-5 text-primary" />
                <span>Enterprise Security</span>
              </div>
            </div>
          </div>

          {/* Workspace Interface Mockup */}
          <div className="relative max-w-6xl mx-auto opacity-100">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-border hover:shadow-3xl transition-shadow duration-500">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-accent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium">Workly</span>
                  </div>
                  <div className="hidden md:flex items-center space-x-6 text-white/80 text-sm">
                    <span className="hover:text-white cursor-pointer">Home</span>
                    <span className="hover:text-white cursor-pointer">About Us</span>
                    <span className="hover:text-white cursor-pointer">Features</span>
                    <span className="hover:text-white cursor-pointer">Pricing</span>
                    <span className="hover:text-white cursor-pointer">Testimonial</span>
                    <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium">
                      Sign Up
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Main Interface */}
              <div className="p-6 bg-gray-50 min-h-[500px]">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                  {/* Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg p-4 h-full">
                      <h3 className="font-semibold text-gray-900 mb-4">Workspaces</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-primary/10 rounded-lg">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          <span className="text-sm font-medium">Main Workspace</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                          <span className="text-sm text-gray-600">Regional Office</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                          <span className="text-sm text-gray-600">Branch Operations</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                          <span className="text-sm text-gray-600">Department Tasks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Main Content */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Enterprise Dashboard</h2>
                      <div className="flex items-center space-x-3">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 bg-primary rounded-full border-2 border-white"></div>
                          <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white"></div>
                          <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white"></div>
                        </div>
                        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm">
                          Active now
                        </button>
                      </div>
                    </div>

                    {/* Task Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Task 1 */}
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">Quarterly Report</h3>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Complete</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Generate comprehensive quarterly performance analytics
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-xs text-gray-500">Due: Today</span>
                          </div>
                          <div className="flex -space-x-1">
                            <div className="w-6 h-6 bg-primary rounded-full border border-white"></div>
                            <div className="w-6 h-6 bg-green-500 rounded-full border border-white"></div>
                          </div>
                        </div>
                      </div>

                      {/* Task 2 */}
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">AI Document Analysis</h3>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In Progress</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Process and analyze uploaded documents with AI
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-xs text-gray-500">Due: Tomorrow</span>
                          </div>
                          <div className="flex -space-x-1">
                            <div className="w-6 h-6 bg-purple-500 rounded-full border border-white"></div>
                          </div>
                        </div>
                      </div>

                      {/* Task 3 */}
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">Security Audit</h3>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Scheduled</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Comprehensive security review and compliance check
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-xs text-gray-500">Due: Next Week</span>
                          </div>
                          <div className="flex -space-x-1">
                            <div className="w-6 h-6 bg-pink-500 rounded-full border border-white"></div>
                            <div className="w-6 h-6 bg-indigo-500 rounded-full border border-white"></div>
                          </div>
                        </div>
                      </div>

                      {/* Task 4 */}
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">Multi-Workspace Setup</h3>
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Planning</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Configure hierarchical workspace structure
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-xs text-gray-500">Due: Friday</span>
                          </div>
                          <div className="flex -space-x-1">
                            <div className="w-6 h-6 bg-orange-500 rounded-full border border-white"></div>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default HeroSection