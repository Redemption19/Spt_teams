'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MotionDiv, MotionSection } from '@/components/ui/motion'

const Partners = () => {
  const partners = [
    { name: 'Coming Soon', opacity: 'opacity-60' },
    { name: 'Coming Soon', opacity: 'opacity-50' },
    { name: 'Coming Soon', opacity: 'opacity-60' },
    { name: 'Coming Soon', opacity: 'opacity-50' },
    { name: 'Coming Soon', opacity: 'opacity-60' },
  ]

  return (
    <MotionSection className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <div className="text-center mb-12">
            <p className="text-accent text-lg">
              Trusted by leading companies worldwide
            </p>
          </div>
        </MotionDiv>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              className={`${partner.opacity} hover:opacity-100 transition-opacity duration-300`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.1 }}
            >
              <div className="text-2xl font-bold text-foreground">
                {partner.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </MotionSection>
  )
}

export default Partners