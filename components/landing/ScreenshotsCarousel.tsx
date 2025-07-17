import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const screenshots = [
  { src: '/images/screenshot1.png', alt: 'Dashboard screenshot' },
  { src: '/images/screenshot2.png', alt: 'Team management screenshot' },
  { src: '/images/screenshot3.png', alt: 'Reports screenshot' },
];

export default function ScreenshotsCarousel() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % screenshots.length);
  const prev = () => setIndex((i) => (i - 1 + screenshots.length) % screenshots.length);

  return (
    <section className="py-12 px-4 max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-primary">See It In Action</h2>
      <div className="relative flex items-center justify-center">
        <button onClick={prev} aria-label="Previous" className="absolute left-0 z-10 p-2 bg-card rounded-full shadow hover:bg-primary/10 transition-colors">
          &#8592;
        </button>
        <div className="w-full max-w-xl h-72 flex items-center justify-center overflow-hidden rounded-xl border border-border bg-card shadow-enhanced">
          <AnimatePresence mode="wait">
            <motion.img
              key={screenshots[index].src}
              src={screenshots[index].src}
              alt={screenshots[index].alt}
              className="object-contain w-full h-full"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5 }}
            />
          </AnimatePresence>
        </div>
        <button onClick={next} aria-label="Next" className="absolute right-0 z-10 p-2 bg-card rounded-full shadow hover:bg-primary/10 transition-colors">
          &#8594;
        </button>
      </div>
      <div className="flex justify-center mt-4 gap-2">
        {screenshots.map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full ${i === index ? 'bg-primary' : 'bg-muted'}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to screenshot ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
} 