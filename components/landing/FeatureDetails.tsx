import Image from 'next/image';

const details = [
  {
    title: 'Collaboration Workspace',
    description: 'Empower teams to work together efficiently with information-rich workspaces and real-time updates.',
    image: '/images/feature-detail1.png',
  },
  {
    title: 'Sync With Cloud',
    description: 'Sync everything instantly with the cloud and integrate with your favorite tools.',
    image: '/images/feature-detail2.png',
  },
  {
    title: 'Monitoring Task',
    description: 'Track deadlines, priorities, and progress with advanced monitoring and reporting tools.',
    image: '/images/feature-detail3.png',
  },
  {
    title: 'Real Time to Discuss',
    description: 'Bring the team together with chat, video, and collaborative decision-making.',
    image: '/images/feature-detail4.png',
  },
];

export default function FeatureDetails() {
  return (
    <section className="py-12 px-4 max-w-6xl mx-auto" id="features">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-primary">Our tool enables you to dynamically manage workloads</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {details.map((d) => (
          <div key={d.title} className="card-interactive rounded-xl p-6 flex flex-col md:flex-row items-center bg-card shadow-enhanced">
            <Image src={d.image} alt={d.title} width={96} height={96} className="w-24 h-24 object-contain mb-4 md:mb-0 md:mr-6" />
            <div>
              <h3 className="text-xl font-semibold text-primary mb-2">{d.title}</h3>
              <p className="text-muted-foreground">{d.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 