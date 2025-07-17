import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CallToAction() {
  return (
    <section className="py-12 px-4 max-w-3xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-primary/90 via-accent/80 to-background rounded-2xl shadow-enhanced p-10"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to get started?</h2>
        <p className="text-lg text-primary-foreground/90 mb-8">Create your free account or login to join your team and boost productivity today.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" passHref legacyBehavior>
            <a className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-accent transition-colors text-lg">
              Create Account
            </a>
          </Link>
          <Link href="/auth/action" passHref legacyBehavior>
            <a className="px-8 py-3 rounded-full bg-accent text-accent-foreground font-semibold shadow-lg hover:bg-primary transition-colors text-lg">
              Login
            </a>
          </Link>
        </div>
      </motion.div>
    </section>
  );
} 