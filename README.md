# Bookkeep SaaS

Intelligent bookkeeping for modern life. Natural language expense tracking, beautiful visualizations, credit card insights, and privacy-first architecture.

## Features

- 🗣️ **Natural Language Entry** - Type "morning coffee at tim hortons $5" or "paid credit card bill half of 150"
- 📊 **Beautiful Visualizations** - Interactive charts for spending trends, category breakdowns, cash flow, net worth
- 💳 **Credit Card Intelligence** - Automatic statement tracking, payoff projections, minimum payment calculations
- 👥 **Household & Team Sharing** - Role-based access (owner, admin, member, viewer) with privacy controls
- 🔒 **Privacy-First Architecture** - Local-first encryption option, run fully offline, self-hostable
- 🌍 **Multi-Currency & Global** - USD, CAD, EUR, GBP, INR, AUD with real-time exchange rates

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS v3 with custom design system (Trust Teal + Coral + Sage)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Supabase Auth (email/password, OAuth)
- **Payments**: Stripe (subscriptions, checkout, portal)
- **Email**: Resend (transactional emails)
- **Charts**: Recharts (animated, responsive)
- **AI/NLP**: Custom natural language parser (no external AI dependency)
- **Deployment**: Vercel (frontend), Supabase (database)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- Stripe account
- Resend account (optional, for emails)

### Installation

```bash
# Clone and install
cd bookkeep-saas
pnpm install

# Copy environment variables
cp .env.example .env.local

# Fill in your .env.local with actual values
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_TEAM_MONTHLY=price_...
STRIPE_PRICE_ID_TEAM_YEARLY=price_...

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Bookkeep

# Encryption (for local-first privacy)
ENCRYPTION_KEY=your-32-char-encryption-key-here
```

### Database Setup

```bash
# Start Supabase locally (optional)
supabase start

# Push migrations to your Supabase project
supabase db push

# Or run migrations manually in Supabase SQL editor
```

### Development

```bash
# Start dev server
pnpm dev

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

### Deployment

```bash
# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
# Connect Supabase project
# Configure Stripe webhooks
```

## Project Structure

```
bookkeep-saas/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard page
│   │   ├── api/                # API routes
│   │   ├── globals.css         # Global styles & design system
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── charts/             # Chart components (Recharts)
│   │   ├── nlp/                # Natural language input
│   │   └── providers/          # React context providers
│   ├── lib/
│   │   ├── supabase/           # Supabase clients
│   │   ├── crypto/             # Encryption utilities
│   │   ├── nlp/                # NLP expense parser
│   │   ├── types/              # TypeScript types
│   │   └── utils.ts            # Utility functions
│   └── middleware.ts           # Auth middleware
├── supabase/
│   └── migrations/             # Database migrations
├── public/                     # Static assets
├── .env.example                # Environment template
├── next.config.mjs             # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json
```

## Design System

### Colors
- **Trust Teal** (`#0d9488`) - Primary brand, trust, finances
- **Warm Coral** (`#f97316`) - Accent for income, positive actions, alerts
- **Sage Green** (`#168a47`) - Savings, growth, success states
- **Slate** - Neutral grays for UI

### Typography
- **Display**: DM Serif Display (headlines)
- **Sans**: DM Sans (body, UI)
- **Mono**: JetBrains Mono (numbers, code)

### Components
All components use glassmorphism cards with backdrop blur, subtle borders, and layered shadows. Dark mode is default with light mode support.

## NLP Parser

The natural language parser (`src/lib/nlp/expense-parser.ts`) handles:

- **Expenses**: "morning tea at tim hortons 10 dollars"
- **Income**: "salary received 5000"
- **Splits**: "paid credit card bill half of 150"
- **Recurring**: "monthly netflix subscription 15.99"
- **Queries**: "how much did i spend on groceries this month?"
- **Credit Card**: "what is my credit card balance?"

No external AI API required - runs entirely client-side or server-side.

## Privacy Features

- **Client-side encryption** using Web Crypto API (AES-GCM)
- **Local-first** - works offline, syncs when online
- **Field-level encryption** for sensitive transaction data
- **Self-hostable** - deploy to your own infrastructure
- **No telemetry** - zero tracking by default

## License

MIT License - feel free to use for personal or commercial projects.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a PR

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@bookkeep.app