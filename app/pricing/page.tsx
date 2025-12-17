'use client'

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "0",
      description: "Perfect for trying ARCHON with small projects",
      features: [
        "Up to 5 Lambda functions",
        "2 N8N workflows",
        "Basic persona modes",
        "Community support",
        "1GB memory limit",
        "Public GitHub repos only"
      ],
      cta: "Start Free",
      popular: false,
      color: "from-gray-600 to-gray-700"
    },
    {
      name: "Professional",
      price: "49",
      description: "For growing teams and production workloads",
      features: [
        "Up to 50 Lambda functions",
        "Unlimited N8N workflows",
        "All persona modes",
        "Priority support (24h response)",
        "10GB memory limit",
        "Private repos included",
        "Cost optimization AI",
        "Self-healing workflows",
        "Custom integrations"
      ],
      cta: "Start 14-Day Trial",
      popular: true,
      color: "from-purple-600 to-blue-600"
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large-scale operations requiring dedicated support",
      features: [
        "Unlimited Lambda functions",
        "Dedicated infrastructure",
        "All features included",
        "24/7 support + Slack channel",
        "Unlimited memory",
        "On-premise deployment option",
        "Custom SLA guarantees",
        "Dedicated success manager",
        "White-label options",
        "Training & onboarding"
      ],
      cta: "Contact Sales",
      popular: false,
      color: "from-yellow-600 to-orange-600"
    }
  ]

  const addOns = [
    {
      name: "🎯 Advanced Analytics",
      price: "$29/mo",
      description: "Deep insights into your infrastructure"
    },
    {
      name: "🔒 Enhanced Security",
      price: "$49/mo",
      description: "SOC 2 compliance + penetration testing"
    },
    {
      name: "🚀 Dedicated Resources",
      price: "$199/mo",
      description: "Reserved compute capacity"
    }
  ]

  const faqs = [
    {
      q: "Can I change plans anytime?",
      a: "Yes! Upgrade or downgrade instantly. You'll be charged prorated."
    },
    {
      q: "What happens after the trial?",
      a: "Your account automatically converts to Free tier. No credit card required for trial."
    },
    {
      q: "Do you offer refunds?",
      a: "Yes, 30-day money-back guarantee on all paid plans."
    },
    {
      q: "How does pricing scale?",
      a: "We bill based on active resources. Unused capacity doesn't count."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Start free, scale as you grow. No hidden fees.
          </p>
        </div>

        {/* ROI Calculator Teaser */}
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-3xl p-8 border border-green-500/30 mb-16 text-center">
          <div className="text-5xl mb-4">💰</div>
          <h3 className="text-2xl font-bold mb-2">Average ROI: 850%</h3>
          <p className="text-gray-300 mb-4">
            Our customers save an average of $2,400/month in infrastructure costs
          </p>
          <div className="text-sm text-gray-400">
            Based on 127+ production deployments
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl border ${
                plan.popular
                  ? 'border-purple-500 shadow-2xl shadow-purple-500/50 scale-105'
                  : 'border-white/10'
              } bg-white/5 backdrop-blur-xl overflow-hidden`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1 text-sm font-bold rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  {plan.price === "Custom" ? (
                    <div className="text-4xl font-black">Custom</div>
                  ) : (
                    <div>
                      <span className="text-5xl font-black">${plan.price}</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                  )}
                </div>

                <button
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-8 ${
                    plan.popular
                      ? `bg-gradient-to-r ${plan.color} hover:scale-105 shadow-lg`
                      : 'bg-white/10 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-green-400 mt-1">✓</span>
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Optional Add-ons</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {addOns.map((addon, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all"
              >
                <div className="text-3xl mb-3">{addon.name.split(' ')[0]}</div>
                <h4 className="text-xl font-bold mb-2">{addon.name.substring(3)}</h4>
                <p className="text-gray-400 text-sm mb-4">{addon.description}</p>
                <div className="text-2xl font-bold text-purple-400">{addon.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
              >
                <h4 className="font-bold text-lg mb-3">{faq.q}</h4>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-4">Still have questions?</h2>
          <p className="text-xl text-purple-100 mb-8">
            Our team is here to help you find the perfect plan
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/contact"
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
            >
              Talk to Sales
            </a>
            <a
              href="/demos"
              className="px-8 py-4 bg-white/20 backdrop-blur rounded-xl font-bold text-lg hover:bg-white/30 transition-colors border border-white/30"
            >
              Try Demo First
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
