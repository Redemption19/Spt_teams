import { motion } from 'framer-motion';
import Image from 'next/image';

const testimonials = [
  {
    quote: 'Spt Teams transformed how our team collaborates. The UI is beautiful and the features are exactly what we needed!',
    name: 'Jane Doe',
    avatar: '/images/avatar1.png',
  },
  {
    quote: 'The analytics and reporting tools are top-notch. We save hours every week!',
    name: 'John Smith',
    avatar: '/images/avatar2.png',
  },
  {
    quote: 'I love the mobile experience and the real-time notifications. Highly recommended!',
    name: 'Alex Lee',
    avatar: '/images/avatar3.png',
  },
];

export default function Testimonials() {
  return (
    <section className="py-12 px-4 max-w-5xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-primary">What Our Users Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, idx) => (
          <motion.div
            key={t.name}
            className="card-interactive rounded-xl p-6 flex flex-col items-center text-center shadow-enhanced bg-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <Image src={t.avatar} alt={t.name} width={64} height={64} className="w-16 h-16 rounded-full mb-4 object-cover border-2 border-primary" />
            <blockquote className="text-lg italic text-muted-foreground mb-4">“{t.quote}”</blockquote>
            <span className="font-semibold text-primary">{t.name}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
} 