import { X, TrendingUp, Building2, Shield, IndianRupee, Star, Zap } from 'lucide-react';

interface RevenuePricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PricingTier {
  name: string;
  price: string;
  subtitle: string;
  badge?: string;
  features: string[];
  isPro?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'STARTER',
    price: '₹75,000',
    subtitle: 'Small Venues (<5,000 attendees)',
    features: [
      'Basic zone monitoring',
      '2 PA channels',
      'Email alerts',
      'Standard support',
    ],
  },
  {
    name: 'PRO',
    price: '₹2,50,000',
    subtitle: 'Large Concerts & Sports',
    badge: 'MOST POPULAR',
    isPro: true,
    features: [
      'All Starter features',
      'AI surge prediction',
      'SOS dispatch',
      'Police/BMC integration',
      '3D drone feed',
      'Priority support',
    ],
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    subtitle: 'Stadiums, Kumbh Mela, Govt',
    features: [
      'Everything in Pro',
      'Dedicated infra',
      'White-label',
      'Government SLA',
      '24/7 NOC',
      'NDRF integration',
    ],
  },
];

const revenueStreams = [
  {
    icon: <IndianRupee className="w-5 h-5 text-violet-400" />,
    emoji: '💼',
    title: 'SaaS Licensing',
    description: 'Event-by-event or annual contracts.',
    target: 'Target: ₹8–12 Cr ARR Year 2',
  },
  {
    icon: <Building2 className="w-5 h-5 text-sky-400" />,
    emoji: '🏛️',
    title: 'Government Contracts',
    description: 'Smart City mission + NDRF.',
    target: 'Target: ₹15 Cr in Year 3',
  },
  {
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
    emoji: '🛡️',
    title: 'Insurance Partnerships',
    description: 'Premium reduction for certified venues.',
    target: 'Rev-share model',
  },
];

const marketMetrics = [
  { label: '₹2,400 Cr Market' },
  { label: '830+ Major Events/Year in India' },
  { label: 'Target: 12% Market Share by Y3' },
];

const tamData = [
  { label: 'TAM', value: '₹2,400 Cr', width: 'w-full', color: 'bg-slate-500' },
  { label: 'SAM', value: '₹480 Cr', width: 'w-1/5', color: 'bg-sky-500' },
  { label: 'SOM', value: '₹58 Cr', width: 'w-[2.4%]', color: 'bg-violet-500' },
];

export default function RevenuePricingModal({ isOpen, onClose }: RevenuePricingModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-6 h-6 text-violet-400" />
              <h2 className="text-2xl font-bold text-white">
                SurgeGuard Revenue &amp; Go-To-Market
              </h2>
            </div>
            <p className="text-slate-400 text-sm">
              Built for India's ₹2,400 Cr event safety market
            </p>
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-xl p-6 border transition-all ${
                  tier.isPro
                    ? 'border-violet-500 bg-gradient-to-b from-violet-950/60 to-slate-900/80 shadow-violet-900/30 shadow-lg'
                    : 'border-slate-700 bg-slate-900/60'
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                      <Star className="w-3 h-3" />
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Tier Name */}
                <div className="mb-4">
                  <span
                    className={`text-xs font-bold tracking-widest uppercase ${
                      tier.isPro ? 'text-violet-400' : 'text-slate-400'
                    }`}
                  >
                    {tier.name}
                  </span>
                  <div className="mt-1">
                    <span className="text-3xl font-extrabold text-white">{tier.price}</span>
                    {tier.price !== 'Custom' && (
                      <span className="text-slate-400 text-sm ml-1">/event</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{tier.subtitle}</p>
                </div>

                {/* Divider */}
                <div
                  className={`h-px mb-4 ${
                    tier.isPro ? 'bg-violet-700/50' : 'bg-slate-700/60'
                  }`}
                />

                {/* Features */}
                <ul className="flex-1 space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                      <Zap
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          tier.isPro ? 'text-violet-400' : 'text-slate-500'
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Revenue Streams */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              Revenue Streams
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {revenueStreams.map((stream) => (
                <div
                  key={stream.title}
                  className="rounded-xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-600 transition-colors"
                >
                  <div className="text-2xl mb-2">{stream.emoji}</div>
                  <h4 className="text-white font-semibold text-sm mb-1">{stream.title}</h4>
                  <p className="text-slate-400 text-xs mb-2">{stream.description}</p>
                  <span className="inline-block text-xs font-medium text-violet-400 bg-violet-950/60 border border-violet-800/50 px-2 py-0.5 rounded-full">
                    {stream.target}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Market Size Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {marketMetrics.map((m) => (
              <span
                key={m.label}
                className="inline-block bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-2 rounded-full"
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* TAM / SAM / SOM */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
            <h3 className="text-base font-semibold text-white mb-5">
              Market Opportunity — TAM / SAM / SOM
            </h3>
            <div className="space-y-4">
              {tamData.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-12 text-xs font-bold text-slate-400 uppercase shrink-0">
                    {item.label}
                  </div>
                  <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} ${item.width} min-w-[4px]`}
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-semibold text-slate-200 shrink-0">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-4">
              SOM assumes 2.4% market capture via direct sales and government tenders by Year 3.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
