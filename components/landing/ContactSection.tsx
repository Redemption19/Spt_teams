'use client'

import React from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare, Globe, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { MotionDiv, MotionSection, MotionCard, MotionButton } from '@/components/ui/motion';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help with your questions',
    contact: 'support@workly.com',
    response: 'Response within 24 hours',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak with our team directly',
    contact: '+233205430962',
    response: 'Available Mon-Fri, 9AM-6PM EST',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Instant help when you need it',
    contact: 'Chat with us now',
    response: 'Available 24/7',
    color: 'from-purple-500 to-purple-600'
  }
];

const faqs = [
  {
    question: 'How does the one-time payment work?',
    answer: 'You pay once and get lifetime access to your chosen plan. No recurring charges, no hidden fees.'
  },
  {
    question: 'Can I upgrade my plan later?',
    answer: 'Yes! You can upgrade to a higher tier anytime. We\'ll credit your previous payment towards the new plan.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, we\'ll refund your payment in full.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Start with our 14-day free trial to explore all features before making your decision.'
  }
];

const ContactSection = () => {
  return (
    <MotionSection className="max-w-7xl mx-auto py-20 px-4">
      {/* Header Section */}
      <div className="text-center mb-16">
        <MotionDiv variant="fadeInUp" delay={0.1}>
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Contact Us
          </div>
        </MotionDiv>
        <MotionDiv variant="fadeInUp" delay={0.2}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Get in Touch
          </h1>
        </MotionDiv>
        <MotionDiv variant="fadeInUp" delay={0.3}>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Have questions about Workly? Need help getting started? Our team is here to help you succeed.
          </p>
        </MotionDiv>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {contactMethods.map((method, index) => (
          <MotionCard
            key={index}
            delay={0.4 + index * 0.1}
            className="bg-card rounded-xl p-8 shadow-lg border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`w-16 h-16 bg-gradient-to-r ${method.color} rounded-xl flex items-center justify-center mb-6`}>
              <method.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{method.title}</h3>
            <p className="text-muted-foreground mb-4">{method.description}</p>
            <div className="space-y-2">
              <div className="font-semibold text-primary">{method.contact}</div>
              <div className="text-sm text-muted-foreground">{method.response}</div>
            </div>
          </MotionCard>
        ))}
      </div>

      {/* Main Contact Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Contact Form */}
        <MotionDiv variant="fadeInLeft" delay={0.7}>
          <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
            <h3 className="text-2xl font-bold text-foreground mb-6">Send us a Message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-muted rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border" 
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-muted rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border" 
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full bg-muted rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border" 
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company</label>
                <input 
                  type="text" 
                  className="w-full bg-muted rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border" 
                  placeholder="Your Company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <select className="w-full bg-muted rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border">
                  <option>General Inquiry</option>
                  <option>Sales Question</option>
                  <option>Technical Support</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                <textarea 
                  rows={5} 
                  className="w-full bg-muted rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border" 
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <MotionButton 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-semibold shadow hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </MotionButton>
            </form>
          </div>
        </MotionDiv>

        {/* Contact Info */}
        <MotionDiv variant="fadeInRight" delay={0.8}>
          <div className="space-y-8">
            <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-6">Contact Information</h3>
              <div className="space-y-6">
                <MotionDiv 
                  className="flex items-start gap-4"
                  variant="fadeInRight"
                  delay={0.9}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Email</div>
                    <div className="text-primary">support@workly.com</div>
                    <div className="text-sm text-muted-foreground">For general inquiries</div>
                  </div>
                </MotionDiv>

                <MotionDiv 
                  className="flex items-start gap-4"
                  variant="fadeInRight"
                  delay={1.0}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Phone</div>
                    <div className="text-primary">+233205430962</div>
                    <div className="text-sm text-muted-foreground">Mon-Fri, 9AM-6PM EST</div>
                  </div>
                </MotionDiv>

                <MotionDiv 
                  className="flex items-start gap-4"
                  variant="fadeInRight"
                  delay={1.1}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Location</div>
                    <div className="text-primary">Accra Ghana</div>
                    <div className="text-sm text-muted-foreground">Accra</div>
                  </div>
                </MotionDiv>

                <MotionDiv 
                  className="flex items-start gap-4"
                  variant="fadeInRight"
                  delay={1.2}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Business Hours</div>
                    <div className="text-primary">Monday - Friday</div>
                    <div className="text-sm text-muted-foreground">9:00 AM - 6:00 PM EST</div>
                  </div>
                </MotionDiv>
              </div>
            </div>

            {/* Response Time */}
            <MotionDiv 
              className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20"
              variant="fadeInUp"
              delay={1.3}
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Quick Response</span>
              </div>
              <p className="text-sm text-muted-foreground">
                We typically respond to all inquiries within 24 hours during business days.
              </p>
            </MotionDiv>
          </div>
        </MotionDiv>
      </div>

      {/* FAQ Section */}
      <MotionDiv variant="fadeInUp" delay={1.4}>
        <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <MotionDiv 
                key={index} 
                className="space-y-2"
                variant="fadeInUp"
                delay={1.5 + index * 0.1}
              >
                <h4 className="font-semibold text-foreground">{faq.question}</h4>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </MotionDiv>
    </MotionSection>
  );
};

export default ContactSection; 