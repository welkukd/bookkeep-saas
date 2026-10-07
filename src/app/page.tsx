import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Sparkles, TrendingUp, CreditCard, Shield, 
  Users, Smartphone, BarChart3, PieChart,
  Zap, Lock, Globe, ArrowRight, CheckCircle,
  ChevronRight, Star, Moon, Sun, Monitor, DollarSign, Target
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Intelligent Bookkeeping for Modern Life',
  description: 'Natural language expense tracking, beautiful visualizations, credit card insights, and privacy-first architecture. Built for individuals, families, and small businesses.',
  openGraph: {
    title: 'Bookkeep — Intelligent Bookkeeping for Modern Life',
    description: 'Natural language expense tracking, beautiful visualizations, credit card insights, and privacy-first architecture.',
    images: ['/og-image.svg'],
  },
};

const features = [
  {
    icon: Sparkles,
    title: 'Natural Language Entry',
    description: 'Just type "morning coffee at tim hortons $5" or "paid credit card bill half of 150". Our AI understands context, categories, splits, and recurring patterns automatically.',
    color: 'trust',
  },
  {
    icon: BarChart3,
    title: 'Beautiful Visualizations',
    description: 'Interactive charts for spending trends, category breakdowns, cash flow, net worth growth, and savings rates. All animated, responsive, and exportable.',
    color: 'sage',
  },
  {
    icon: CreditCard,
    title: 'Credit Card Intelligence',
    description: 'Automatic statement tracking, minimum payment calculations, payoff projections, and "how much do I owe this month" answers in seconds.',
    color: 'coral',
  },
  {
    icon: Users,
    title: 'Household & Team Sharing',
    description: 'Share with your spouse, family, or business partner. Role-based access (owner, admin, member, viewer) with private/visible transaction controls.',
    color: 'trust',
  },
  {
    icon: Lock,
    title: 'Privacy-First Architecture',
    description: 'Local-first encryption option. Your sensitive data encrypted client-side before sync. Run fully offline or self-host. We never see your transactions.',
    color: 'sage',
  },
  {
    icon: Globe,
    title: 'Multi-Currency & Global',
    description: 'Support for USD, CAD, EUR, GBP, INR, AUD with real-time exchange rates. Perfect for digital nomads, expats, and international families.',
    color: 'coral',
  },
];

const stats = [
  { value: '50K+', label: 'Transactions Processed' },
  { value: '99.9%', label: 'Uptime Guarantee' },
  { value: '2s', label: 'Average Parse Time' },
  { value: '100%', label: 'Data Ownership' },
];

const testimonials = [
  {
    quote: "Finally, a bookkeeping app that doesn't make me feel like I'm doing taxes. I just talk to it naturally and it understands everything — categories, splits with my wife, even recurring subscriptions.",
    author: 'Sarah Chen',
    role: 'Product Designer',
    avatar: 'SC',
  },
  {
    quote: "The credit card projection feature alone saved me $200 in interest last month. It told me exactly what I'd owe before the statement even generated. Game changer.",
    author: 'Marcus Johnson',
    role: 'Freelance Developer',
    avatar: 'MJ',
  },
  {
    quote: "We use it for our small agency — 8 people tracking expenses, client reimbursements, and team budgets. The household sharing with roles is exactly what we needed.",
    author: 'Priya Sharma',
    role: 'Agency Owner',
    avatar: 'PS',
  },
];

const pricing: Array<{
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  variant: 'primary' | 'secondary';
  popular: boolean;
}> = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for personal use',
    features: [
      '1 household, 1 member',
      '3 accounts',
      '100 transactions/month',
      '5 budgets & 3 goals',
      'Credit card tracking',
      'Basic charts & reports',
      '50MB attachments',
      '10 OCR credits/month',
    ],
    cta: 'Start Free',
    variant: 'secondary',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For power users & couples',
    features: [
      '3 households, 2 members each',
      '10 accounts',
      '1,000 transactions/month',
      '20 budgets & 10 goals',
      'Advanced reports & projections',
      'Custom categories & recurring rules',
      '500MB attachments',
      '100 OCR credits/month',
      'Priority email support',
    ],
    cta: 'Go Pro',
    variant: 'primary',
    popular: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: '/month',
    description: 'For small businesses & teams',
    features: [
      '10 households, 10 members each',
      '25 accounts',
      '5,000 transactions/month',
      '50 budgets & 25 goals',
      'API access & webhooks',
      'Custom integrations',
      '2GB attachments',
      '500 OCR credits/month',
      'Priority support + Slack',
      'SSO & audit logs',
    ],
    cta: 'Start Team Trial',
    variant: 'primary',
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border backdrop-blur-xl">
        <div className="container-main flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" aria-label="Bookkeep Home">
            <div className="w-8 h-8 rounded-xl bg-gradient-trust flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-heading-md font-medium text-text-primary">Bookkeep</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-body-sm text-text-muted hover:text-text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="text-body-sm text-text-muted hover:text-text-primary transition-colors">Pricing</Link>
            <Link href="#testimonials" className="text-body-sm text-text-muted hover:text-text-primary transition-colors">Testimonials</Link>
            <Link href="/login" className="text-body-sm text-text-muted hover:text-text-primary transition-colors">Sign In</Link>
            <Link href="/signup">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Link href="/signup">
              <Button size="sm" fullWidth>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-trust" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-trust-500/5 via-transparent to-transparent" aria-hidden="true" />
        
        <div className="container-main relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="trust" dot className="mb-6 inline-flex" style={{ animationDelay: '0ms' }}>
              <Sparkles className="w-3 h-3" />
              Now with AI-powered natural language entry
            </Badge>
            
            <h1 className="text-display-xl lg:text-[5rem] font-display font-light text-text-primary mb-6" style={{ animationDelay: '100ms' }}>
              Bookkeeping that{' '}
              <span className="gradient-text-trust">understands you</span>
            </h1>
            
            <p className="text-body-lg lg:text-xl text-text-secondary max-w-3xl mx-auto mb-10" style={{ animationDelay: '200ms' }}>
              Type naturally: <code className="bg-surface px-2 py-1 rounded font-mono text-sm">&ldquo;morning tea at tim hortons 10 dollars&rdquo;</code> or ask <code className="bg-surface px-2 py-1 rounded font-mono text-sm">&ldquo;how much is my credit card bill this month?&rdquo;</code> Beautiful charts, zero friction.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16" style={{ animationDelay: '300ms' }}>
              <Link href="/signup">
                <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
                  Start Free — No Credit Card
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="#demo" className="btn-secondary btn-lg w-full sm:w-auto">
                <Monitor className="w-5 h-5" />
                Watch Demo
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-body-sm text-text-muted" style={{ animationDelay: '400ms' }}>
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-heading-lg font-display font-medium gradient-text-trust">{stat.value}</span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative" style={{ animationDelay: '500ms' }}>
            <div className="max-w-5xl mx-auto">
              <div className="glass-card-elevated rounded-2xl overflow-hidden border border-border shadow-glass-xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-coral-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-sage-500" />
                  </div>
                  <div className="flex-1 text-center text-caption text-text-muted font-mono">
                    dashboard.bookkeep.app
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Income', value: '$8,450', icon: DollarSign, color: 'text-sage-500', trend: '+12.5%' },
                      { label: 'Expenses', value: '$3,210', icon: CreditCard, color: 'text-coral-500', trend: '-8.2%' },
                      { label: 'Net Flow', value: '$5,240', icon: TrendingUp, color: 'text-trust-500', trend: '+15.3%' },
                      { label: 'Savings Rate', value: '62%', icon: Target, color: 'text-sage-500', trend: 'Target: 20%+' },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 bg-surface/50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-caption text-text-muted">{stat.label}</span>
                          <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                        </div>
                        <div className="text-2xl font-display font-medium text-text-primary">{stat.value}</div>
                        <div className="text-caption text-sage-500 mt-1">{stat.trend}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-48 bg-gradient-to-b from-trust-500/5 to-transparent rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-mesh-coral opacity-50" aria-hidden="true" />
        <div className="container-main relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge variant="trust" dot className="mb-4">
              <Sparkles className="w-3 h-3" />
              Features
            </Badge>
            <h2 className="text-display-lg font-display font-light text-text-primary mb-4">
              Everything you need to{' '}
              <span className="gradient-text-trust">master your money</span>
            </h2>
            <p className="text-body-lg text-text-secondary">
              From daily coffee to annual tax prep — one app that grows with you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={feature.title} variant="elevated" className="group hover:shadow-glass-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-xl" style={{ 
                    backgroundColor: `var(--color-${feature.color}-100)`,
                    color: `var(--color-${feature.color}-600)`
                  }}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-heading-md font-display font-medium text-text-primary">{feature.title}</h3>
                  <p className="text-body text-text-secondary">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 lg:py-32">
        <div className="container-main">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-display-lg font-display font-light text-text-primary mb-4">
              Start in <span className="gradient-text-trust">30 seconds</span>
            </h2>
            <p className="text-body-lg text-text-secondary">No complex setup, no bank passwords required unless you want to connect.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Create Account', description: 'Sign up with email. Create your household. Invite family or team members.', icon: Users },
              { step: '02', title: 'Add Accounts', description: 'Add checking, savings, credit cards, cash, crypto — manually or connect via Plaid (optional).', icon: CreditCard },
              { step: '03', title: 'Start Tracking', description: 'Type naturally or use quick buttons. "Lunch at Chipotle $18". AI categorizes, splits, learns.', icon: Sparkles },
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-trust flex items-center justify-center text-2xl font-display font-medium text-white mb-8">
                  {step.step}
                </div>
                <div className="pt-8">
                  <div className="p-3 rounded-xl bg-surface border border-border inline-block mb-4">
                    <step.icon className="w-7 h-7 text-trust-500" />
                  </div>
                  <h3 className="text-heading-md font-display font-medium text-text-primary mb-2">{step.title}</h3>
                  <p className="text-body text-text-secondary">{step.description}</p>
                </div>
                {i < 2 && (
                  <div className="absolute top-8 left-[50%] w-full h-1 bg-gradient-to-r from-trust-500/30 to-transparent hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-mesh-trust opacity-50" aria-hidden="true" />
        <div className="container-main relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge variant="trust" dot className="mb-4">
              <Star className="w-3 h-3" />
              Trusted by thousands
            </Badge>
            <h2 className="text-display-lg font-display font-light text-text-primary mb-4">
              Loved by <span className="gradient-text-trust">individuals & teams</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <Card key={i} variant="elevated" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-body text-text-secondary mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-trust flex items-center justify-center text-white font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">{testimonial.author}</p>
                    <p className="text-body-sm text-text-muted">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 lg:py-32">
        <div className="container-main">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge variant="trust" dot className="mb-4">
              <Lock className="w-3 h-3" />
              Simple, transparent pricing
            </Badge>
            <h2 className="text-display-lg font-display font-light text-text-primary mb-4">
              Choose your <span className="gradient-text-trust">perfect plan</span>
            </h2>
            <p className="text-body-lg text-text-secondary">All plans include a 14-day Pro trial. No credit card required. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((plan, i) => (
              <Card 
                key={plan.name} 
                variant={plan.popular ? 'elevated' : 'default'} 
                className={plan.popular ? 'border-border-accent relative' : ''}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="trust" className="px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <h3 className="text-heading-md font-display font-medium text-text-primary">{plan.name}</h3>
                    <p className="text-body-sm text-text-muted mt-1">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-display-lg font-display font-medium text-text-primary">{plan.price}</span>
                      <span className="text-body text-text-muted">{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-body-sm">
                        <CheckCircle className="w-5 h-5 text-sage-500 flex-shrink-0" />
                        <span className="text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/signup">
                    <Button variant={plan.variant} fullWidth className="group">
                      {plan.cta}
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-trust" aria-hidden="true" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" aria-hidden="true" />
        <div className="container-main relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-display-lg font-display font-light text-white mb-6">
              Ready to understand your money?
            </h2>
            <p className="text-body-lg text-white/80 mb-8">
              Join thousands who've made bookkeeping effortless. Free forever for personal use.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2 bg-white text-slate-900 hover:bg-white/90">
                  Start Free Today
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                  Explore Features
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-body-sm text-white/60">
              No credit card • Cancel anytime • Export your data anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4" aria-label="Bookkeep Home">
                <div className="w-8 h-8 rounded-xl bg-gradient-trust flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-heading-md font-medium text-text-primary">Bookkeep</span>
              </Link>
              <p className="text-body-sm text-text-muted">Intelligent bookkeeping for modern life. Natural language. Beautiful charts. Privacy first.</p>
            </div>
            
            <div>
              <h4 className="text-heading-sm font-medium text-text-primary mb-4">Product</h4>
              <ul className="space-y-2 text-body-sm text-text-muted">
                <li><Link href="#features" className="hover:text-text-primary transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-text-primary transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-text-primary transition-colors">API</Link></li>
                <li><Link href="/changelog" className="hover:text-text-primary transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-heading-sm font-medium text-text-primary mb-4">Company</h4>
              <ul className="space-y-2 text-body-sm text-text-muted">
                <li><Link href="/about" className="hover:text-text-primary transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-text-primary transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-text-primary transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-heading-sm font-medium text-text-primary mb-4">Legal</h4>
              <ul className="space-y-2 text-body-sm text-text-muted">
                <li><Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-text-primary transition-colors">Security</Link></li>
                <li><Link href="/cookies" className="hover:text-text-primary transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
            <p className="text-body-sm text-text-muted">© 2024 Bookkeep. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="https://twitter.com/bookkeepapp" target="_blank" rel="noopener" className="text-text-muted hover:text-text-primary transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
              </a>
              <a href="https://github.com/bookkeep" target="_blank" rel="noopener" className="text-text-muted hover:text-text-primary transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://linkedin.com/company/bookkeep" target="_blank" rel="noopener" className="text-text-muted hover:text-text-primary transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}