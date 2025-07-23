'use client'

import React from 'react'
import { Zap, Mail, Phone, MapPin, Twitter, Facebook, Linkedin as LinkedIn, Instagram } from 'lucide-react'
import { motion } from 'framer-motion'
import { MotionDiv } from '@/components/ui/motion'

const Footer = () => {
  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Integrations', href: '#integrations' },
      { name: 'API', href: '#api' },
    ],
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'Careers', href: '#careers' },
      { name: 'Press', href: '#press' },
      { name: 'Contact', href: '#contact' },
    ],
    support: [
      { name: 'Help Center', href: '#help' },
      { name: 'Documentation', href: '#docs' },
      { name: 'Community', href: '#community' },
      { name: 'Status', href: '#status' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Terms of Service', href: '#terms' },
      { name: 'Cookie Policy', href: '#cookies' },
      { name: 'GDPR', href: '#gdpr' },
    ],
  }

  const socialLinks = [
    { icon: Twitter, href: '#twitter' },
    { icon: Facebook, href: '#facebook' },
    { icon: LinkedIn, href: '#linkedin' },
    { icon: Instagram, href: '#instagram' },
  ]

  return (
    <motion.footer 
      className="bg-card border-t border-border"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, staggerChildren: 0.1, delayChildren: 0.2 }}
        >
          {/* Company Info */}
          <MotionDiv variant="fadeInUp" delay={0.1} className="lg:col-span-2">
            <motion.div 
              className="flex items-center space-x-2 mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Zap className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-card-foreground">Workly</span>
            </motion.div>
            
            <motion.p 
              className="text-muted-foreground mb-6 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              The modern workspace management platform that helps teams organize work, 
              set priorities, and get results faster.
            </motion.p>
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, staggerChildren: 0.1 }}
            >
              {[
                { icon: Mail, text: 'contact@workly.com' },
                { icon: Phone, text: '+233205430962' },
                { icon: MapPin, text: 'Accra Ghana' }
              ].map((contact, idx) => (
                <motion.div 
                  key={idx}
                  className="flex items-center space-x-2 text-muted-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                  whileHover={{ x: 5, color: "hsl(var(--primary))", transition: { duration: 0.2 } }}
                >
                  <contact.icon className="w-4 h-4" />
                  <span>{contact.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </MotionDiv>

          {/* Product Links */}
          <MotionDiv variant="fadeInUp" delay={0.2}>
            <motion.h3 
              className="font-semibold text-card-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Product
            </motion.h3>
            <motion.ul 
              className="space-y-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, staggerChildren: 0.1, delayChildren: 0.1 }}
            >
              {footerLinks.product.map((link, idx) => (
                <motion.li 
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                >
                  <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </MotionDiv>

          {/* Company Links */}
          <MotionDiv variant="fadeInUp" delay={0.3}>
            <motion.h3 
              className="font-semibold text-card-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Company
            </motion.h3>
            <motion.ul 
              className="space-y-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, staggerChildren: 0.1, delayChildren: 0.1 }}
            >
              {footerLinks.company.map((link, idx) => (
                <motion.li 
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                >
                  <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </MotionDiv>

          {/* Support Links */}
          <MotionDiv variant="fadeInUp" delay={0.4}>
            <motion.h3 
              className="font-semibold text-card-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Support
            </motion.h3>
            <motion.ul 
              className="space-y-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, staggerChildren: 0.1, delayChildren: 0.1 }}
            >
              {footerLinks.support.map((link, idx) => (
                <motion.li 
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                >
                  <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </MotionDiv>

          {/* Legal Links */}
          <MotionDiv variant="fadeInUp" delay={0.5}>
            <motion.h3 
              className="font-semibold text-card-foreground mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Legal
            </motion.h3>
            <motion.ul 
              className="space-y-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, staggerChildren: 0.1, delayChildren: 0.1 }}
            >
              {footerLinks.legal.map((link, idx) => (
                <motion.li 
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                >
                  <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </MotionDiv>
        </motion.div>

        {/* Bottom Section */}
        <MotionDiv variant="fadeInUp" delay={0.6}>
          <div className="border-t border-border pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
            <motion.p 
              className="text-muted-foreground text-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              © 2024 Workly. All rights reserved.
            </motion.p>
            
            <motion.div 
              className="flex space-x-4 mt-4 md:mt-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, staggerChildren: 0.1 }}
            >
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.2, 
                    rotate: 15,
                    color: "hsl(var(--primary))",
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </motion.div>
          </div>
        </MotionDiv>
      </div>
    </motion.footer>
  )
}

export default Footer