'use client'

import React from 'react'

const Partners = () => {
  const partners = [
    { name: 'Google', opacity: 'opacity-60' },
    { name: 'Airtable', opacity: 'opacity-50' },
    { name: 'Upwork', opacity: 'opacity-60' },
    { name: 'Asana', opacity: 'opacity-50' },
    { name: 'Airbnb', opacity: 'opacity-60' },
  ]

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-accent text-lg">
            Trusted by leading companies worldwide
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {partners.map((partner, index) => (
            <div
              key={index}
              className={`${partner.opacity} hover:opacity-100 transition-opacity duration-300`}
            >
              <div className="text-2xl font-bold text-foreground">
                {partner.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Partners