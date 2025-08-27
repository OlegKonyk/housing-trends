# 🏠 Housing & Rent Trends Dashboard

A modern, full-stack web application for tracking housing and rental market trends across US counties using government data sources.

## 🚀 Current Status

**✅ COMPLETED FEATURES:**
- ✅ **Infrastructure**: AWS CDK setup with complete cloud architecture
- ✅ **Backend API**: NestJS with comprehensive data models and services
- ✅ **Frontend**: Next.js with interactive data visualizations
- ✅ **Authentication**: JWT-based auth with registration, login, password reset
- ✅ **Saved Searches**: Advanced search with filtering and saved criteria
- ✅ **Notifications**: Multi-channel notification system with email alerts
- ✅ **CI/CD**: GitHub Actions with AWS deployment pipeline
- ✅ **Documentation**: Architecture, testing strategy, and roadmap

**🔄 IN PROGRESS:**
- 🔄 **E2E Testing**: Playwright framework setup (Next)

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI**: Shadcn/ui + Radix UI + Tailwind CSS
- **Charts**: Recharts for data visualization
- **Maps**: Mapbox GL JS for interactive maps
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Theming**: Next-themes for dark/light mode

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis with BullMQ for job queues
- **Auth**: JWT + Passport + Bcrypt
- **API**: OpenAPI/Swagger documentation
- **Validation**: Class-validator + Joi

### DevOps & Cloud (AWS)
- **Infrastructure**: AWS CDK (TypeScript)
- **Compute**: ECS Fargate for containerized apps
- **Database**: RDS PostgreSQL with read replicas
- **Cache**: ElastiCache Redis
- **Storage**: S3 + CloudFront for static assets
- **Email**: SES for notifications
- **Monitoring**: CloudWatch + X-Ray
- **Security**: WAF + Secrets Manager

### Testing Stack
- **E2E**: Playwright (planned)
- **API**: Supertest + Jest
- **Component**: Testing Library + Vitest
- **Visual**: Percy/Chromatic
- **Performance**: Lighthouse CI
- **Accessibility**: axe-core

## 📊 Data Sources

- **HUD User**: Federal housing data
- **Census Bureau**: Demographic and housing statistics
- **FRED**: Economic indicators
- **Bureau of Labor Statistics**: Employment data

## 🏗 Project Structure

```
housing-trends/
├── apps/
│   ├── api/                 # NestJS backend
│   └── web/                 # Next.js frontend
├── packages/
│   ├── database/            # Prisma schema & client
│   ├── types/               # Shared TypeScript types
│   └── utils/               # Shared utilities
├── infrastructure/
│   └── cdk/                 # AWS CDK infrastructure
├── docs/                    # Documentation
└── scripts/                 # Build & deployment scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Docker & Docker Compose
- AWS CLI (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OlegKonyk/housing-trends.git
   cd housing-trends
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start local development**
   ```bash
   # Start database and Redis
   docker-compose up -d
   
   # Run database migrations
   pnpm db:migrate
   
   # Start development servers
   pnpm dev
   ```

### Development Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm build                  # Build all packages
pnpm test                   # Run tests
pnpm lint                   # Lint code
pnpm format                 # Format code

# Database
pnpm db:migrate            # Run migrations
pnpm db:studio             # Open Prisma Studio

# AWS Deployment
pnpm deploy:dev            # Deploy to development
pnpm deploy:staging        # Deploy to staging
pnpm deploy:prod           # Deploy to production
```

## 🔐 Authentication Features

- **User Registration** with email verification
- **JWT-based Authentication** with refresh tokens
- **Password Reset** via email
- **Protected Routes** with role-based access
- **Rate Limiting** on sensitive endpoints

## 🔍 Search & Analytics

- **Advanced Filtering**: State, county, price ranges, trends
- **Saved Searches**: Custom criteria with notifications
- **Search History**: Track user search patterns
- **Popular Searches**: Analytics on common queries
- **Similar Counties**: AI-powered recommendations

## 📧 Notification System

- **In-App Notifications**: Real-time updates
- **Email Alerts**: Scheduled market updates
- **Price Alerts**: Custom threshold notifications
- **Multiple Frequencies**: Daily, weekly, monthly
- **Queue Processing**: Background job handling

## 🧪 Testing Strategy

### E2E Testing (Next Phase)
- **Authentication Flows**: Login, registration, password reset
- **Search Functionality**: Complex queries and filtering
- **Saved Searches**: CRUD operations and notifications
- **Data Visualization**: Charts and map interactions
- **Responsive Design**: Mobile and desktop testing

### API Testing
- **Endpoint Validation**: Request/response testing
- **Authentication**: JWT token validation
- **Rate Limiting**: Security testing
- **Error Handling**: Edge case coverage

### Component Testing
- **UI Components**: Individual component testing
- **Form Validation**: Input validation testing
- **State Management**: Context and store testing

## 📈 Performance & Monitoring

- **Lighthouse CI**: Performance monitoring
- **CloudWatch**: Application metrics
- **X-Ray**: Distributed tracing
- **Error Tracking**: Comprehensive logging

## 🔒 Security Features

- **JWT Token Rotation**: Secure authentication
- **Password Hashing**: Bcrypt with salt
- **Rate Limiting**: DDoS protection
- **CORS Configuration**: Cross-origin security
- **Input Validation**: XSS and injection protection

## 📚 Documentation

- [📖 Architecture Documentation](./docs/architecture/) - Comprehensive system design and implementation guides
- [🗺️ Project Roadmap](./docs/ROADMAP.md) - Development phases and feature planning
- [🌿 Branch Strategy](./docs/BRANCH_SUMMARY.md) - Git workflow and branch management
- [📝 Blog Posts](./docs/blog/) - Technical articles and development insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Next Steps

1. **E2E Testing Setup**: Implement Playwright testing framework
2. **Data Integration**: Connect to government APIs
3. **Performance Optimization**: Implement caching and CDN
4. **Mobile App**: React Native companion app
5. **Advanced Analytics**: Machine learning insights

---

**Built with ❤️ for the housing market community**
