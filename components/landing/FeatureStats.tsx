import { BarChart2, Users, CheckCircle } from 'lucide-react';

const stats = [
  {
    icon: <BarChart2 className="w-8 h-8 text-primary" />,
    value: '500K+',
    label: 'Projects Managed',
  },
  {
    icon: <Users className="w-8 h-8 text-accent" />,
    value: '250K+',
    label: 'Users',
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-primary" />,
    value: '100%',
    label: 'Uptime',
  },
];

export default function FeatureStats() {
  return (
    <section className="w-full py-8 bg-background">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center text-center px-6">
            <div className="mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
            <div className="text-muted-foreground text-sm font-medium">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
} 