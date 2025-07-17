import { motion } from 'framer-motion';
import Image from 'next/image';

const features = [
  {
    icon: '/images/feature1.png',
    title: 'Project Management',
    description: 'Organize, track, and deliver projects efficiently with powerful tools and real-time collaboration.'
  },
  {
    icon: '/images/feature2.png',
    title: 'Team Collaboration',
    description: 'Communicate, share files, and work together seamlessly across teams and departments.'
  },
  {
    icon: '/images/feature3.png',
    title: 'Analytics & Reports',
    description: 'Gain insights with advanced analytics, custom dashboards, and exportable reports.'
  },
  {
    icon: '/images/feature4.png',
    title: 'Role-Based Access',
    description: 'Secure your workspace with granular permissions and role-based access control.'
  },
  {
    icon: '/images/feature5.png',
    title: 'Mobile Friendly',
    description: 'Access your workspace on any device with a fully responsive, mobile-first design.'
  },
  {
    icon: '/images/feature6.png',
    title: 'Integrations',
    description: 'Connect with your favorite tools and automate workflows for maximum productivity.'
  },
];

export default function FeaturesShowcase() {
  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-primary">Features</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.title}
            className="card-interactive rounded-xl p-6 flex flex-col items-center text-center shadow-enhanced bg-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <Image src={feature.icon} alt={feature.title} width={64} height={64} className="w-16 h-16 mb-4 object-contain" />
            <h3 className="text-xl font-semibold text-primary mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
} 