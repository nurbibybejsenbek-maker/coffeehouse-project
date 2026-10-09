# CoffeeHouse - Full-Featured Coffee Shop Website

A modern, responsive, and accessible coffee shop web application with public storefront and admin dashboard. Built with Next.js, TypeScript, Tailwind CSS, and PostgreSQL.

## Features

### Public Storefront
- 🌐 Multi-language support (Kazakh, Russian, English)
- 🛒 Shopping cart with localStorage persistence
- 📱 Responsive design (mobile-first)
- 🎨 Dark/Light mode toggle
- 📋 Menu with categories and search
- 🗓️ Table reservations
- 📝 Customer reviews
- 🖼️ Gallery with lightbox
- 💳 Payment simulation (Kaspi/PayBox)
- 🤖 AI coffee recommender

### Admin Dashboard
- 📊 Analytics and statistics
- 📦 Order management
- 🗓️ Reservation management
- 🍽️ Menu CRUD operations
- 👥 Customer management
- ⭐ Review moderation
- 💰 Payment tracking

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **i18n**: next-intl
- **PWA**: Service Worker, Manifest
- **UI Components**: Radix UI, shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- PostgreSQL database
- Environment variables (see `.env.example`)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Coffee.WEB
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your database URL and other required variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/coffeehouse?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database:
```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed the database with sample data
pnpm db:seed
```

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](и) in your browser.

## Default Admin Credentials

After seeding:
- Email: `admin@coffeehouse.kz`
- Password: `admin123`

## Project Structure

```
├── app/
│   ├── [locale]/          # Localized pages
│   │   ├── menu/          # Menu page
│   │   ├── cart/         # Shopping cart
│   │   ├── order/        # Order checkout
│   │   ├── reservation/   # Table reservations
│   │   ├── gallery/       # Photo gallery
│   │   ├── reviews/      # Customer reviews
│   │   ├── contact/      # Contact page
│   │   └── about/        # About page
│   ├── admin/             # Admin dashboard (protected)
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── ...               # Other components
├── lib/                   # Utilities and helpers
├── prisma/               # Database schema and migrations
├── messages/              # i18n translation files
└── public/               # Static assets
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:studio` - Open Prisma Studio

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database Setup

For production, use one of these options:
- **Supabase**: Free PostgreSQL hosting
- **Render**: PostgreSQL database service
- **Railway**: Easy PostgreSQL setup

Update `DATABASE_URL` in your environment variables.

## Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Your app URL
- `JWT_SECRET` - JWT signing secret
- `PAYMENT_MODE` - Payment mode (sandbox/production)
- `KASPI_API_KEY` - Kaspi payment API key
- `PAYBOX_API_KEY` - PayBox payment API key
- `SENDGRID_API_KEY` - SendGrid email API key (optional)

## Features in Detail

### Multi-language Support
- Automatic browser language detection
- Manual language switcher
- Full translation coverage for all pages

### Shopping Cart
- Persistent cart (localStorage for guests)
- Add/remove items
- Quantity management
- Price calculations

### Order System
- Multiple order types (Pickup, Dine-in, Delivery)
- Multiple payment methods (Cash, Card, Kaspi, PayBox, Online)
- Order confirmation with QR code
- Email notifications (optional)

### Reservations
- Calendar-based date selection
- Time slot selection
- Table assignment
- Guest count management

### AI Recommender
- Rule-based coffee recommendations
- Considers taste preferences (bitter/sweet)
- Milk preference (with milk/black)
- Strength preference (light/medium/strong)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own coffee shop!

## Support

For issues and questions, please open an issue on GitHub.

---

Made with ☕ by CoffeeHouse Team

