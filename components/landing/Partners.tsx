import Image from 'next/image';

const partners = [
  { name: 'Google', logo: '/images/partner-google.png' },
  { name: 'Airtable', logo: '/images/partner-airtable.png' },
  { name: 'Upwork', logo: '/images/partner-upwork.png' },
  { name: 'Asana', logo: '/images/partner-asana.png' },
  { name: 'Airbnb', logo: '/images/partner-airbnb.png' },
];

export default function Partners() {
  return (
    <section className="w-full bg-background py-6 border-y border-border">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8">
        {partners.map((p) => (
          <Image
            key={p.name}
            src={p.logo}
            alt={p.name}
            width={96}
            height={32}
            className="h-8 w-auto grayscale opacity-80 hover:opacity-100 transition-all"
          />
        ))}
      </div>
    </section>
  );
} 