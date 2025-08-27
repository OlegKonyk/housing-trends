# 🏗️ Architecture Overview

## 🎯 System Design Philosophy

The Housing Trends Dashboard is built with a **modern, scalable, and testable architecture** that prioritizes:

- **Separation of Concerns**: Clear boundaries between frontend, backend, and infrastructure
- **Type Safety**: Full TypeScript coverage across the entire stack
- **Developer Experience**: Hot reloading, comprehensive tooling, and clear documentation
- **Scalability**: Microservices-ready architecture with containerization
- **Testing**: Built-in testing capabilities at every layer
- **Security**: Authentication, authorization, and data protection by design

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Next.js   │  │   React     │  │   UI/UX     │            │
│  │   (App Router)│  │   Components │  │   Components │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   CORS      │  │   Rate      │  │   Security  │            │
│  │   Headers   │  │   Limiting  │  │   Headers   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ REST API
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   NestJS    │  │   Modules   │  │   Services  │            │
│  │   Framework │  │   (Auth,    │  │   (Business │            │
│  │             │  │   Search,   │  │    Logic)   │            │
│  │             │  │   Housing)  │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Database Queries
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data Layer                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  PostgreSQL │  │   Redis     │  │   External  │            │
│  │  (Primary   │  │   (Cache &  │  │    APIs     │            │
│  │   Database) │  │   Sessions) │  │  (HUD,      │            │
│  │             │  │             │  │   Census)   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Infrastructure
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   AWS CDK   │  │   Docker    │  │   CI/CD     │            │
│  │   (IaC)     │  │   (Containers)│  │   (GitHub   │            │
│  │             │  │             │  │   Actions)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack Breakdown

### Frontend Stack
- **Next.js 15**: React framework with App Router for server-side rendering and routing
- **TypeScript**: Type-safe JavaScript for better developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Shadcn/ui**: High-quality, accessible UI components built on Radix UI
- **React Query**: Data fetching, caching, and state management
- **Zustand**: Lightweight state management for client-side state

### Backend Stack
- **NestJS**: Progressive Node.js framework with TypeScript support
- **Prisma**: Type-safe database ORM with auto-generated client
- **PostgreSQL**: Primary relational database
- **Redis**: In-memory cache and session storage
- **BullMQ**: Job queue for background processing
- **JWT**: Stateless authentication tokens

### Infrastructure Stack
- **AWS CDK**: Infrastructure as Code using TypeScript
- **Docker**: Containerization for consistent deployments
- **GitHub Actions**: CI/CD pipeline automation
- **AWS Services**: ECS, RDS, ElastiCache, S3, CloudFront, SES

## 📦 Component Responsibilities

### Frontend Components
- **Pages**: Route-based components with server-side rendering
- **Components**: Reusable UI components with TypeScript interfaces
- **Hooks**: Custom React hooks for business logic
- **Contexts**: Global state management (auth, theme)
- **Utils**: Helper functions and utilities

### Backend Modules
- **Auth Module**: User authentication, authorization, and session management
- **Search Module**: Advanced search functionality and saved searches
- **Notifications Module**: Multi-channel notification system
- **Housing Module**: Housing data management and external API integration
- **Users Module**: User profile and account management
- **Health Module**: System health checks and monitoring

### Infrastructure Components
- **CDK Stacks**: AWS resource definitions and configurations
- **Docker Images**: Containerized application deployments
- **CI/CD Pipelines**: Automated testing and deployment workflows
- **Monitoring**: CloudWatch metrics and logging

## 🔄 Data Flow

### User Authentication Flow
1. User submits credentials via frontend form
2. Frontend sends request to NestJS auth endpoint
3. Backend validates credentials against PostgreSQL
4. JWT tokens generated and returned to frontend
5. Frontend stores tokens and updates authentication state
6. Subsequent requests include JWT in Authorization header

### Search and Data Flow
1. User performs search with filters
2. Frontend sends search request to NestJS API
3. Backend queries PostgreSQL with Prisma ORM
4. Results cached in Redis for performance
5. Search history logged for analytics
6. Results returned to frontend for display

### Notification Flow
1. System event triggers notification (price change, new data)
2. Notification created in PostgreSQL
3. Background job queued in BullMQ
4. Email notification sent via AWS SES
5. In-app notification displayed to user
6. Notification status updated in database

## 🛡️ Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with refresh token rotation
- **Password Hashing**: Bcrypt with salt for secure password storage
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Request validation using class-validator

### Data Protection
- **Database Encryption**: AWS RDS encryption at rest
- **HTTPS**: TLS encryption for all API communications
- **Environment Variables**: Secure configuration management
- **Secrets Management**: AWS Secrets Manager for sensitive data

## 📊 Performance Architecture

### Caching Strategy
- **Redis Cache**: Frequently accessed data and session storage
- **CDN**: CloudFront for static asset delivery
- **Database Indexing**: Optimized queries with Prisma
- **Lazy Loading**: Code splitting and dynamic imports

### Scalability
- **Containerization**: Docker for consistent deployments
- **Load Balancing**: AWS Application Load Balancer
- **Auto Scaling**: ECS Fargate auto-scaling groups
- **Database Scaling**: Read replicas and connection pooling

## 🧪 Testing Architecture

### Testing Layers
- **Unit Tests**: Individual component and service testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Full user workflow testing with Playwright
- **Performance Tests**: Load testing and performance monitoring

### Testing Tools
- **Jest**: Unit and integration testing framework
- **Supertest**: API testing utilities
- **Playwright**: End-to-end testing framework
- **Testing Library**: React component testing utilities

## 🚀 Deployment Architecture

### Environment Strategy
- **Development**: Local development with Docker Compose
- **Staging**: AWS staging environment for testing
- **Production**: AWS production environment with monitoring

### Deployment Pipeline
1. Code pushed to GitHub repository
2. GitHub Actions triggers CI/CD pipeline
3. Tests run automatically (unit, integration, E2E)
4. Docker images built and pushed to ECR
5. AWS CDK deploys infrastructure changes
6. Application deployed to ECS Fargate
7. Health checks verify successful deployment

## 📈 Monitoring & Observability

### Application Monitoring
- **CloudWatch**: Application metrics and logging
- **X-Ray**: Distributed tracing for request flows
- **Custom Metrics**: Business-specific performance indicators
- **Error Tracking**: Comprehensive error logging and alerting

### Infrastructure Monitoring
- **AWS CloudWatch**: Infrastructure metrics and alarms
- **Health Checks**: Application and database health monitoring
- **Cost Monitoring**: AWS cost tracking and optimization
- **Security Monitoring**: Security event logging and alerting

---

**This architecture provides a solid foundation for a scalable, maintainable, and testable housing trends dashboard application.**
