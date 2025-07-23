'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { MotionDiv, MotionSection, MotionCard, MotionText } from '@/components/ui/motion'
import Image from 'next/image'

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Product Manager',
      company: 'TechCorp',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
      rating: 5,
      content: 'Workly has completely transformed how our team manages projects. The intuitive interface and powerful features have increased our productivity by 40%.'
    },
    {
      name: 'Michael Chen',
      role: 'Engineering Lead',
      company: 'StartupXYZ',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
      rating: 5,
      content: 'The best project management tool we\'ve ever used. The collaboration features are outstanding and the analytics help us make data-driven decisions.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Creative Director',
      company: 'DesignHub',
      avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
      rating: 5,
      content: 'Workly strikes the perfect balance between simplicity and functionality. Our creative team loves how easy it is to track progress and collaborate.'
    },
    {
      name: 'David Thompson',
      role: 'CEO',
      company: 'InnovateNow',
      avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
      rating: 5,
      content: 'Since implementing Workly, our team communication has improved dramatically. The real-time updates and notifications keep everyone aligned.'
    }
  ]

  return (
    <MotionSection id="testimonials" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <MotionDiv variant="fadeInUp" delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
          </MotionDiv>
          <MotionDiv variant="fadeInUp" delay={0.2}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Don&apos;t just take our word for it. Here&apos;s what real users think about Workly
            </p>
          </MotionDiv>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <MotionCard
              key={index}
              delay={0.3 + index * 0.1}
              className="bg-card rounded-lg p-6 border border-border card-hover"
            >
              <MotionDiv 
                className="flex items-center mb-4"
                variant="scaleIn"
                delay={0.4 + index * 0.1}
              >
                {[...Array(testimonial.rating)].map((_, i) => (
                  <MotionDiv
                    key={i}
                    variant="scaleIn"
                    delay={0.5 + index * 0.1 + i * 0.1}
                  >
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </MotionDiv>
                ))}
              </MotionDiv>
              <MotionDiv 
                className="text-card-foreground mb-6 italic"
                variant="fadeInUp"
                delay={0.6 + index * 0.1}
              >
                <p>&ldquo;{testimonial.content}&rdquo;</p>
              </MotionDiv>
              <MotionDiv 
                className="flex items-center"
                variant="fadeInLeft"
                delay={0.7 + index * 0.1}
              >
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-card-foreground">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </MotionDiv>
            </MotionCard>
          ))}
        </div>
      </div>
    </MotionSection>
  )
}

export default Testimonials