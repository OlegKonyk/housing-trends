# 🏠 Housing & Rent Trends Dashboard

> A modern, data-driven web application for tracking housing and rental market trends across the United States, built with a focus on comprehensive end-to-end testing and automation.

## 🎯 Project Goals

1. **Technical Excellence**: Showcase modern web development with TypeScript and cutting-edge tools
2. **Testing Mastery**: Implement comprehensive E2E test automation patterns
3. **Real-World Value**: Provide genuine insights into housing market trends
4. **Knowledge Sharing**: Document learnings through blog posts and open-source contributions

## 🚀 Features

### Core Functionality
- 📊 **Interactive Data Visualization**: Charts and graphs showing housing trends
- 🗺️ **Geographic Analysis**: Interactive maps with county-level data
- 🔍 **Advanced Search**: Filter by location, price range, property type
- 👤 **User Accounts**: Save searches and preferences
- 📧 **Email Notifications**: Scheduled updates for saved regions
- 📱 **Responsive Design**: Mobile-first approach
- 🌙 **Dark Mode**: Toggle between light and dark themes

### Data Insights
- Median rent and home prices by county
- Income vs. rent ratio analysis
- Historical trend comparisons
- Market heat maps
- Affordability calculators

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Data Viz**: Recharts + Mapbox GL JS
- **Forms**: React Hook Form + Zod

### Backend
- **API**: NestJS or Fastify
- **Database**: PostgreSQL + Prisma ORM
- **Caching**: Redis
- **Queue**: BullMQ
- **Auth**: Supabase Auth
- **Email**: Resend

### Testing
- **E2E**: Playwright
- **API**: Supertest + Jest
- **Unit/Integration**: Vitest
- **Visual Regression**: Percy
- **Performance**: Lighthouse CI
- **Accessibility**: axe-core

### DevOps
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Monitoring**: Sentry
- **Analytics**: PostHog

## 📊 Data Sources

- **HUD (Housing and Urban Development)**: Fair Market Rents, Income Limits
- **Census Bureau**: American Community Survey, Housing Statistics
- **FRED (Federal Reserve)**: Economic indicators
- **BLS (Bureau of Labor Statistics)**: Consumer Price Index for housing

## 🧪 Testing Strategy

This project serves as a comprehensive testing playground:

### E2E Test Scenarios
1. **Authentication Flows**: Registration, login, password reset, OAuth
2. **Data Interactions**: Search, filter, sort, paginate
3. **Map Interactions**: Zoom, pan, region selection
4. **Chart Interactions**: Hover tooltips, data point selection
5. **User Workflows**: Save searches, manage notifications
6. **API Testing**: Rate limiting, error handling, data validation
7. **Performance Testing**: Load times, bundle sizes, Core Web Vitals
8. **Accessibility Testing**: WCAG compliance, keyboard navigation

## 📁 Project Structure

```
housing-trends/
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── api/                 # NestJS backend
│   └── e2e/                 # Playwright tests
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── database/            # Prisma schema & migrations
│   ├── types/               # Shared TypeScript types
│   └── utils/               # Shared utilities
├── docker/                  # Docker configurations
├── .github/
│   └── workflows/           # CI/CD pipelines
├── docs/
│   ├── architecture/        # System design docs
│   ├── testing/             # Testing strategies
│   └── blog/                # Blog post drafts
└── scripts/                 # Build & deployment scripts
```

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/housing-trends.git
cd housing-trends

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development services
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# E2E tests with UI
pnpm test:e2e:ui

# All tests with coverage
pnpm test:all
```

## 📝 Blog Topics

Planned blog posts to share our learnings:

1. **"Building a Robust E2E Testing Strategy with Playwright"**
2. **"Testing Interactive Maps and Charts: Challenges and Solutions"**
3. **"Implementing Visual Regression Testing in CI/CD"**
4. **"Performance Testing Strategies for Data-Heavy Applications"**
5. **"Authentication Testing: Covering All Edge Cases"**
6. **"API Testing Best Practices with Real Government Data"**
7. **"Accessibility Testing: Beyond Compliance"**
8. **"Test Data Management Strategies for Complex Applications"**

## 🎓 Learning Objectives

- Master modern E2E testing frameworks
- Implement comprehensive CI/CD pipelines
- Handle complex async operations in tests
- Test data visualization components
- Implement visual regression testing
- Create maintainable test architectures
- Document and share testing knowledge

## 🤝 Contributing

This project is open source and welcomes contributions! Check out our [Contributing Guide](docs/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Government data providers (HUD, Census Bureau, FRED, BLS)
- Open source community
- Testing framework maintainers

---

**Built with ❤️ for the testing community**
