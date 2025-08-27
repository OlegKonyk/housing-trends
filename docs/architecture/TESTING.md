# 🧪 Testing Architecture

## 🎯 Testing Design Philosophy

The testing strategy is built with **comprehensive coverage** and **automated testing** to ensure:

- **Quality Assurance**: Catch bugs early in the development cycle
- **Regression Prevention**: Automated tests prevent breaking changes
- **Documentation**: Tests serve as living documentation
- **Confidence**: Developers can refactor with confidence
- **Performance**: Continuous performance monitoring and testing
- **Accessibility**: Automated accessibility testing for inclusive design

## 🏗️ Testing Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    E2E Tests                               │ │
│  │              (Playwright - 10%)                            │ │
│  │  • User workflows                                          │ │
│  │  • Critical business paths                                 │ │
│  │  • Cross-browser testing                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Integration Tests                           │ │
│  │              (Jest + Supertest - 20%)                      │ │
│  │  • API endpoint testing                                    │ │
│  │  • Database integration                                    │ │
│  │  • External service mocking                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Unit Tests                               │ │
│  │              (Jest + Testing Library - 70%)                │ │
│  │  • Component testing                                       │ │
│  │  • Service logic testing                                   │ │
│  │  • Utility function testing                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Testing Technology Stack

### Unit Testing: Jest + Testing Library

**Why Jest?**
- **Zero Configuration**: Works out of the box with minimal setup
- **Fast Execution**: Parallel test execution for speed
- **Rich Ecosystem**: Extensive mocking and assertion libraries
- **Code Coverage**: Built-in coverage reporting
- **Watch Mode**: Interactive development with file watching

**Why Testing Library?**
- **User-Centric**: Tests focus on user behavior, not implementation
- **Accessibility**: Built-in accessibility testing utilities
- **Best Practices**: Encourages testing best practices
- **Framework Agnostic**: Works with React, Vue, Angular, etc.

**Unit Test Example:**
```typescript
// Component unit test
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './login-form';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders login form with all required fields', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm onSubmit={mockOnSubmit} />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm onSubmit={mockOnSubmit} />
      </QueryClientProvider>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid credentials', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm onSubmit={mockOnSubmit} />
      </QueryClientProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Integration Testing: Jest + Supertest

**Why Supertest?**
- **HTTP Testing**: Easy HTTP endpoint testing
- **Express Integration**: Native Express.js integration
- **Response Assertions**: Rich response assertion library
- **Middleware Testing**: Test middleware in isolation
- **Database Integration**: Test with real database connections

**Integration Test Example:**
```typescript
// API integration test
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterEach(async () => {
    await prismaService.cleanDatabase();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body.user.email).toBe(userData.email);
          expect(res.body.user.name).toBe(userData.name);
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          expect(res.body.user.password).toBeUndefined();
        });
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email');
          expect(res.body.message).toContain('password');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });
  });
});
```

### End-to-End Testing: Playwright

**Why Playwright?**
- **Multi-Browser**: Test across Chromium, Firefox, and WebKit
- **Auto-Waiting**: Automatic waiting for elements to be ready
- **Network Interception**: Mock network requests and responses
- **Visual Testing**: Built-in visual regression testing
- **Mobile Testing**: Emulate mobile devices and touch events
- **Parallel Execution**: Fast parallel test execution

**E2E Test Example:**
```typescript
// E2E test with Playwright
import { test, expect } from '@playwright/test';

test.describe('Housing Trends Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display home page with search functionality', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Housing Trends Dashboard/);

    // Check main navigation
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();

    // Check search section
    await expect(page.getByText(/search housing data/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter location/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /search/i })).toBeVisible();
  });

  test('should allow user registration and login', async ({ page }) => {
    // Navigate to registration page
    await page.getByRole('link', { name: /register/i }).click();
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/welcome, test user/i)).toBeVisible();

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/.*login/);

    // Login with created account
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should be logged in again
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/welcome, test user/i)).toBeVisible();
  });

  test('should search for housing data and display results', async ({ page }) => {
    // Login first
    await page.getByRole('link', { name: /login/i }).click();
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Navigate to search page
    await page.getByRole('link', { name: /search/i }).click();

    // Fill search form
    await page.getByLabel(/state/i).selectOption('CA');
    await page.getByLabel(/county/i).selectOption('Los Angeles');
    await page.getByLabel(/property type/i).selectOption('rental');
    await page.getByRole('button', { name: /search/i }).click();

    // Check results
    await expect(page.getByText(/search results/i)).toBeVisible();
    await expect(page.getByText(/los angeles county/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    // Check data visualization
    await expect(page.getByText(/trends chart/i)).toBeVisible();
    await expect(page.getByText(/price trends/i)).toBeVisible();
  });

  test('should save search and manage saved searches', async ({ page }) => {
    // Login and perform search
    await page.getByRole('link', { name: /login/i }).click();
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.getByRole('link', { name: /search/i }).click();
    await page.getByLabel(/state/i).selectOption('CA');
    await page.getByLabel(/county/i).selectOption('Los Angeles');
    await page.getByRole('button', { name: /search/i }).click();

    // Save search
    await page.getByRole('button', { name: /save search/i }).click();
    await page.getByLabel(/search name/i).fill('LA Rental Trends');
    await page.getByLabel(/description/i).fill('Los Angeles rental market analysis');
    await page.getByRole('button', { name: /save/i }).click();

    // Navigate to saved searches
    await page.getByRole('link', { name: /saved searches/i }).click();
    await expect(page.getByText(/la rental trends/i)).toBeVisible();
    await expect(page.getByText(/los angeles rental market analysis/i)).toBeVisible();

    // Edit saved search
    await page.getByRole('button', { name: /edit/i }).first().click();
    await page.getByLabel(/search name/i).clear();
    await page.getByLabel(/search name/i).fill('Updated LA Search');
    await page.getByRole('button', { name: /update/i }).click();

    await expect(page.getByText(/updated la search/i)).toBeVisible();
  });
});
```

## 📦 Testing Configuration

### Jest Configuration

**Frontend Jest Config:**
```javascript
// apps/web/jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'ts-jest',
  },
};
```

**Backend Jest Config:**
```javascript
// apps/api/jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
```

### Playwright Configuration

**Playwright Config:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 🧪 Testing Patterns

### Component Testing Patterns

**Component Test Setup:**
```typescript
// Test utilities
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {ui}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Custom hooks testing
const renderHookWithProviders = <TProps, TResult>(
  hook: (props: TProps) => TResult
) => {
  const queryClient = createTestQueryClient();
  
  return renderHook(hook, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    ),
  });
};
```

### API Testing Patterns

**API Test Setup:**
```typescript
// API test utilities
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/database/prisma.service';

export class TestApp {
  app: INestApplication;
  prisma: PrismaService;

  async setup() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    await this.app.init();
  }

  async teardown() {
    await this.prisma.cleanDatabase();
    await this.app.close();
  }

  async createTestUser(userData: any) {
    return request(this.app.getHttpServer())
      .post('/auth/register')
      .send(userData)
      .expect(201);
  }

  async loginUser(credentials: any) {
    return request(this.app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);
  }
}
```

### E2E Testing Patterns

**E2E Test Utilities:**
```typescript
// E2E test utilities
import { test as base, expect } from '@playwright/test';

// Custom test fixture with authentication
export const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: async ({ page }, use) => {
    // Login helper
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    
    await use(page);
  },
});

export { expect } from '@playwright/test';

// Page Object Model
export class LoginPage {
  constructor(private page: any) {}

  async goto() {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/.*dashboard/);
  }
}
```

## 📊 Test Coverage Strategy

### Coverage Requirements

**Coverage Thresholds:**
```typescript
// Coverage configuration
const coverageThreshold = {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './src/components/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  './src/hooks/': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
  './src/utils/': {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95,
  },
};
```

### Coverage Reporting

**Coverage Reports:**
```bash
# Generate coverage reports
npm run test:coverage

# Coverage reports generated:
# - HTML: coverage/lcov-report/index.html
# - LCOV: coverage/lcov.info
# - JSON: coverage/coverage-final.json
```

## 🔄 CI/CD Integration

### GitHub Actions Testing

**Testing Workflow:**
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: housing_trends_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/housing_trends_test
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/housing_trends_test
```

## 🎯 Testing Best Practices

### Test Organization

**File Structure:**
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── ...
├── hooks/
│   ├── useAuth.ts
│   ├── useAuth.test.ts
│   └── ...
├── utils/
│   ├── formatCurrency.ts
│   ├── formatCurrency.test.ts
│   └── ...
└── test/
    ├── setup.ts
    ├── utils.tsx
    └── mocks/
        ├── api.ts
        └── data.ts
```

### Testing Guidelines

**Component Testing:**
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility features
- Mock external dependencies
- Test error states and loading states

**API Testing:**
- Test all HTTP methods and status codes
- Test request validation
- Test authentication and authorization
- Test database operations
- Mock external services

**E2E Testing:**
- Test critical user journeys
- Test cross-browser compatibility
- Test responsive design
- Test performance under load
- Test accessibility compliance

---

**This testing architecture provides comprehensive coverage across all layers of the application, ensuring high quality, reliability, and maintainability.**
