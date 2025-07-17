const plans = [
  {
    title: 'Free Plan',
    price: '$0/month',
    features: [
      'Basic features included',
      'Unlimited tasks',
      'Real-time collaboration',
      'Cloud file storage',
    ],
    cta: 'Get Started',
    highlight: false,
  },
  {
    title: 'Pro Plan',
    price: '$1000/month',
    features: [
      'Everything in Free',
      'Advanced project management',
      'Enhanced analytics',
      'Priority support',
    ],
    cta: 'Start Pro',
    highlight: true,
  },
  {
    title: 'Custom Plan',
    price: 'Custom',
    features: [
      'Tailored solutions',
      'Dedicated account manager',
      'Custom integrations',
      'Enterprise support',
    ],
    cta: 'Contact Us',
    highlight: false,
  },
];

export default function PricingPlans() {
  return (
    <section className="py-16 px-4 max-w-6xl mx-auto" id="pricing">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-primary">Find the Perfect Plan to Boost Your Team’s Productivity</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.title}
            className={`rounded-2xl border border-border bg-card shadow-lg p-8 flex flex-col items-center text-center ${plan.highlight ? 'ring-2 ring-primary scale-105 z-10' : ''}`}
          >
            <h3 className="text-xl font-bold mb-2 text-primary">{plan.title}</h3>
            <div className="text-3xl font-extrabold mb-4 text-accent">{plan.price}</div>
            <ul className="mb-6 space-y-2 text-muted-foreground">
              {plan.features.map((f) => (
                <li key={f}>&#10003; {f}</li>
              ))}
            </ul>
            <button className={`px-6 py-2 rounded-full font-semibold shadow transition-colors ${plan.highlight ? 'bg-primary text-primary-foreground hover:bg-accent' : 'bg-accent text-accent-foreground hover:bg-primary'}`}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
} 