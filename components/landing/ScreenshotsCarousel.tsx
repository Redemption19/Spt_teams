'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MotionDiv, MotionSection, MotionButton } from '@/components/ui/motion'
import Image from 'next/image'

const ScreenshotsCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const screenshots = [
    {
      title: 'Project Dashboard',
      description: 'Get a bird\'s eye view of all your projects with our intuitive dashboard',
      image: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    {
      title: 'Task Management',
      description: 'Organize tasks with drag-and-drop functionality and priority settings',
      image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    {
      title: 'Team Collaboration',
      description: 'Work together in real-time with comments, mentions, and file sharing',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    {
      title: 'Analytics & Reports',
      description: 'Track progress and performance with detailed analytics and reporting',
      image: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % screenshots.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length)
  }

  return (
    <MotionSection 
      className="py-20 bg-muted/30"
      variant="fadeInUp"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionDiv 
          className="text-center mb-16"
          variant="fadeInUp"
          delay={0.2}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See Workly in Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the power of our platform through these interactive screenshots
          </p>
        </MotionDiv>

        <MotionDiv 
          className="relative"
          variant="fadeInUp"
          delay={0.4}
        >
          <MotionDiv 
            className="overflow-hidden rounded-2xl shadow-2xl"
            variant="scaleIn"
            delay={0.5}
          >
            <div className="flex transition-transform duration-300 ease-in-out"
                 style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {screenshots.map((screenshot, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <div className="relative">
                    <Image
                      src={screenshot.image}
                      alt={screenshot.title}
                      width={1260}
                      height={600}
                      className="w-full h-[600px] object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                      <div className="p-8 text-white">
                        <h3 className="text-2xl font-bold mb-2">{screenshot.title}</h3>
                        <p className="text-white/90 text-lg max-w-2xl">{screenshot.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </MotionDiv>

          {/* Navigation Buttons */}
          <MotionDiv 
            variant="fadeInLeft"
            delay={0.6}
          >
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors duration-200 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
          </MotionDiv>
          <MotionDiv 
            variant="fadeInRight"
            delay={0.6}
          >
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors duration-200 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          </MotionDiv>

          {/* Dots Indicator */}
          <MotionDiv 
            className="flex justify-center mt-8 space-x-2"
            variant="fadeInUp"
            delay={0.7}
          >
            {screenshots.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentSlide ? 'bg-primary' : 'bg-gray-300'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
              />
            ))}
          </MotionDiv>
        </MotionDiv>
      </div>
    </MotionSection>
  )
}

export default ScreenshotsCarousel