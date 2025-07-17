const highlights = [
  {
    title: 'Focused Workflow for Better Results',
    description: 'Streamline processes, enhance transparency, and boost productivity with our focused workflow tools.',
  },
  {
    title: 'Enhanced Accountability and Efficiency',
    description: 'Assign roles, set deadlines, and monitor progress to ensure accountability and efficient teamwork.',
  },
];

export default function ProductivityHighlight() {
  return (
    <section className="w-full py-12 bg-gradient-to-r from-primary via-accent to-primary/80" id="productivity">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {highlights.map((h) => (
          <div key={h.title} className="rounded-xl bg-white/10 p-8 text-white shadow-lg">
            <h3 className="text-xl font-bold mb-2">{h.title}</h3>
            <p className="text-white/90">{h.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
} 