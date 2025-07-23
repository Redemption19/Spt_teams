'use client'

import React from 'react';
import { Users, Target, Award, Globe, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { MotionDiv, MotionSection, MotionCard } from '@/components/ui/motion';

const team = [
  { 
    name: 'Bismark', 
    role: 'Founder', 
    avatar: '/images/team/sarah.jpg',
    bio: 'Software Engineer'
  },
  // { 
  //   name: 'Michael Chen', 
  //   role: 'CTO & Co-Founder', 
  //   avatar: '/images/team/michael.jpg',
  //   bio: 'Ex-Microsoft engineer with 15+ years building scalable enterprise solutions.'
  // },
  // { 
  //   name: 'Emily Rodriguez', 
  //   role: 'Head of Product', 
  //   avatar: '/images/team/emily.jpg',
  //   bio: 'Product leader with experience at Slack and Asana, focused on user-centric design.'
  // },
  // { 
  //   name: 'David Kim', 
  //   role: 'VP of Engineering', 
  //   avatar: '/images/team/david.jpg',
  //   bio: 'Engineering veteran from Amazon and Netflix, specializing in cloud architecture.'
  // }
];

const values = [
  {
    icon: Target,
    title: 'Innovation First',
    description: 'We constantly push boundaries to deliver cutting-edge solutions that transform how teams work.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Users,
    title: 'User-Centric Design',
    description: 'Every feature is crafted with our users in mind, ensuring intuitive and powerful experiences.',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Built with enterprise-grade security and compliance standards you can trust.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Supporting teams across 50+ countries with localized solutions and 24/7 support.',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'Committed to delivering exceptional quality in every aspect of our platform.',
    color: 'from-pink-500 to-pink-600'
  },
  {
    icon: Zap,
    title: 'Performance',
    description: 'Lightning-fast performance and reliability that keeps your team productive.',
    color: 'from-red-500 to-red-600'
  }
];

const AboutSection = () => {
  return (
    <MotionSection className="max-w-7xl mx-auto py-20 px-4">
      {/* Header Section */}
      <div className="text-center mb-16">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            About Us
          </div>
        </MotionDiv>
        <MotionDiv variant="fadeInUp" delay={0.2}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Building the Future of Work Together
          </h1>
        </MotionDiv>
        <MotionDiv variant="fadeInUp" delay={0.3}>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We&apos;re on a mission to transform how organizations collaborate, manage projects, and achieve their goals through intelligent, scalable, and secure workspace solutions.
          </p>
        </MotionDiv>
      </div>

      {/* Story Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        <MotionDiv variant="fadeInLeft" delay={0.4}>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Our Story
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Founded in 2025, Workly emerged from a simple yet powerful observation: existing workplace tools were fragmented, complex, and failed to address the real needs of modern organizations. As a software engineer, I saw this problem firsthand and decided to build a solution.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The challenge was clear: many platforms are task managers, and only task managers, completely neglecting the critical need for robust, dynamic reporting on operational activities. Even fewer offer the crucial ability to manage an organization&apos;s actual structure, like Regions, Branches, and complex multi-workspace hierarchies.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              You end up with a patchwork of disparate tools – one for tasks, another for reports, perhaps spreadsheets for organizational tracking – leading to inefficiencies and a lack of a single source of truth. That&apos;s why I built Workly: a unified platform that consolidates everything your organization needs.
            </p>
          </div>
        </MotionDiv>
        <MotionDiv variant="fadeInRight" delay={0.5}>
          <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
            <div className="grid grid-cols-2 gap-6 h-full">
              <MotionDiv 
                className="flex flex-col items-center justify-center text-center"
                variant="scaleIn"
                delay={0.6}
              >
                <div className="text-3xl font-bold text-primary mb-2">50K+</div>
                <div className="text-muted-foreground">Active Users</div>
              </MotionDiv>
              <MotionDiv 
                className="flex flex-col items-center justify-center text-center"
                variant="scaleIn"
                delay={0.7}
              >
                <div className="text-3xl font-bold text-accent mb-2">150+</div>
                <div className="text-muted-foreground">Countries</div>
              </MotionDiv>
              <MotionDiv 
                className="flex flex-col items-center justify-center text-center"
                variant="scaleIn"
                delay={0.8}
              >
                <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime</div>
              </MotionDiv>
              <MotionDiv 
                className="flex flex-col items-center justify-center text-center"
                variant="scaleIn"
                delay={0.9}
              >
                <div className="text-3xl font-bold text-accent mb-2">24/7</div>
                <div className="text-muted-foreground">Support</div>
              </MotionDiv>
            </div>
          </div>
        </MotionDiv>
      </div>

      {/* Mission Section */}
      <MotionDiv variant="fadeInUp" delay={0.6}>
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            To provide organizations with a unified platform that consolidates tasks, reports, documents, and communications while offering comprehensive organizational management with native support for Regions, Branches, Departments, and hierarchical workspaces. We believe in delivering dynamic reporting capabilities with real-time analytics, customizable templates, and streamlined approval workflows—all powered by AI for enhanced insights and operational efficiency.
          </p>
        </div>
      </MotionDiv>

      {/* Values Section */}
      <div className="mb-20">
        <MotionDiv variant="fadeInUp" delay={0.7}>
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Our Values</h2>
        </MotionDiv>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <MotionCard
              key={index}
              delay={0.8 + index * 0.1}
              className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${value.color} rounded-lg flex items-center justify-center mb-4`}>
                <value.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {value.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {value.description}
              </p>
            </MotionCard>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div>
        <MotionDiv variant="fadeInUp" delay={1.0}>
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Meet Our Leadership</h2>
        </MotionDiv>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <MotionCard
              key={member.name}
              delay={1.1 + index * 0.1}
              className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-lg font-bold text-primary mb-1">{member.name}</h3>
                <p className="text-accent font-medium mb-3">{member.role}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {member.bio}
                </p>
              </div>
            </MotionCard>
          ))}
        </div>
      </div>
    </MotionSection>
  );
};

export default AboutSection; 