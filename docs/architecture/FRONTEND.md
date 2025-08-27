# 🎨 Frontend Architecture

## 🎯 Frontend Design Philosophy

The frontend is built with **modern React patterns** and **TypeScript-first development** to ensure:

- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Performance**: Optimized rendering with React 18 features
- **Accessibility**: WCAG 2.1 AA compliance with Radix UI primitives
- **Developer Experience**: Hot reloading, comprehensive tooling, and clear patterns
- **Scalability**: Modular component architecture with clear separation of concerns

## 🏗️ Frontend Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Application                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Pages     │  │  Components │  │    Hooks    │            │
│  │ (App Router)│  │   (UI/UX)   │  │ (Custom &   │            │
│  │             │  │             │  │   Library)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Contexts  │  │    Utils    │  │   Styles    │            │
│  │ (Global     │  │ (Helpers &  │  │ (Tailwind   │            │
│  │   State)    │  │  Functions) │  │    CSS)     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   State     │  │   Data      │  │   Routing   │            │
│  │ Management  │  │  Fetching   │  │ (Next.js    │            │
│  │ (Zustand)   │  │ (React Query)│  │   Router)   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack Deep Dive

### Core Framework: Next.js 15

**Why Next.js 15?**
- **App Router**: Modern file-based routing with server components
- **Server-Side Rendering**: Better SEO and initial page load performance
- **TypeScript Support**: First-class TypeScript integration
- **Built-in Optimization**: Automatic code splitting and image optimization
- **API Routes**: Built-in API endpoints for backend integration

**Responsibilities:**
- Application routing and navigation
- Server-side rendering and static generation
- API route handling
- Build optimization and bundling
- Development server and hot reloading

### TypeScript Integration

**Why TypeScript?**
- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Enhanced autocomplete and refactoring
- **Self-Documenting Code**: Types serve as documentation
- **Refactoring Safety**: Confident code changes with type checking

**Configuration:**
```typescript
// tsconfig.json - Strict configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Styling: Tailwind CSS

**Why Tailwind CSS?**
- **Utility-First**: Rapid UI development with utility classes
- **Consistent Design**: Predefined design system and spacing
- **Performance**: Only includes used CSS in production
- **Responsive Design**: Built-in responsive utilities
- **Dark Mode**: Native dark mode support

**Configuration:**
```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { /* custom colors */ },
        secondary: { /* custom colors */ }
      }
    }
  }
}
```

### UI Components: Shadcn/ui + Radix UI

**Why Shadcn/ui?**
- **Accessibility**: Built on Radix UI primitives with ARIA support
- **Customizable**: Copy-paste components with full customization
- **TypeScript**: Fully typed components with proper interfaces
- **Consistent**: Unified design system across the application

**Component Architecture:**
```typescript
// Example component structure
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}
```

### State Management: Zustand + React Query

**Why Zustand?**
- **Lightweight**: Minimal bundle size compared to Redux
- **TypeScript**: Excellent TypeScript support
- **Simple API**: Easy to learn and use
- **Performance**: Efficient re-renders with selective subscriptions

**Why React Query?**
- **Server State**: Dedicated to managing server state
- **Caching**: Intelligent caching and background updates
- **Synchronization**: Automatic data synchronization
- **Optimistic Updates**: Immediate UI updates with rollback

**State Architecture:**
```typescript
// Zustand store example
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

// React Query hooks
const useHousingData = (filters: SearchFilters) => {
  return useQuery({
    queryKey: ['housing', filters],
    queryFn: () => fetchHousingData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

## 📁 Component Architecture

### Page Components (App Router)

**Structure:**
```
src/app/
├── page.tsx                 # Home page
├── layout.tsx              # Root layout
├── globals.css             # Global styles
├── auth/
│   ├── login/page.tsx      # Login page
│   ├── register/page.tsx   # Registration page
│   └── forgot-password/page.tsx
├── dashboard/page.tsx      # User dashboard
├── searches/page.tsx       # Saved searches
└── notifications/page.tsx  # Notifications center
```

**Responsibilities:**
- Route-based components with server-side rendering
- Page-level data fetching and state management
- Layout composition and navigation
- SEO optimization and metadata

### UI Components

**Structure:**
```
src/components/
├── ui/                     # Base UI components (Shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── layout/                 # Layout components
│   ├── header.tsx
│   ├── footer.tsx
│   └── sidebar.tsx
├── features/               # Feature-specific components
│   ├── affordability-calculator.tsx
│   └── county-comparison.tsx
├── home/                   # Home page components
│   ├── hero-section.tsx
│   └── search-section.tsx
└── visualizations/         # Data visualization components
    ├── trends-chart.tsx
    └── map-view.tsx
```

**Component Patterns:**
```typescript
// Compound component pattern
interface CardProps {
  children: React.ReactNode
  className?: string
}

const Card = ({ children, className }: CardProps) => {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      {children}
    </div>
  )
}

Card.Header = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
    {children}
  </div>
)

Card.Content = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-6 pt-0", className)}>
    {children}
  </div>
)
```

### Custom Hooks

**Structure:**
```
src/hooks/
├── use-auth.ts            # Authentication state and methods
├── use-toast.ts           # Toast notification management
├── use-local-storage.ts   # Local storage utilities
└── use-debounce.ts        # Debounce utility
```

**Hook Patterns:**
```typescript
// Custom hook with TypeScript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      if (!response.ok) throw new Error('Login failed')
      
      const data = await response.json()
      setUser(data.user)
      localStorage.setItem('accessToken', data.accessToken)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { user, isLoading, login }
}
```

### Context Providers

**Structure:**
```
src/contexts/
├── auth-context.tsx       # Authentication context
├── theme-context.tsx      # Theme management
└── query-context.tsx      # React Query provider
```

**Context Pattern:**
```typescript
interface AuthContextType {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Context implementation...

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

## 🔄 Data Flow Patterns

### Server State Management

**React Query Integration:**
```typescript
// Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

// Custom hooks for data fetching
export function useHousingData(filters: SearchFilters) {
  return useQuery({
    queryKey: ['housing', filters],
    queryFn: () => fetchHousingData(filters),
    enabled: !!filters.states?.length || !!filters.counties?.length,
  })
}

export function useSavedSearches() {
  return useQuery({
    queryKey: ['saved-searches'],
    queryFn: fetchSavedSearches,
    enabled: !!useAuth().user, // Only fetch if user is authenticated
  })
}
```

### Client State Management

**Zustand Store:**
```typescript
interface AppStore {
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  
  // Actions
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: false,
  theme: 'system',
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}))
```

## 🎨 Styling Architecture

### CSS Architecture

**Global Styles:**
```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other CSS variables */
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variables */
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90;
  }
}
```

### Component Styling

**Utility-First Approach:**
```typescript
// Component with Tailwind classes
const Button = ({ variant = 'default', size = 'default', children, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },
        {
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-11 rounded-md px-8': size === 'lg',
        }
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

## 🧪 Testing Strategy

### Testing Architecture

**Testing Layers:**
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full user workflow testing
- **Visual Regression Tests**: UI consistency testing

**Testing Tools:**
```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from './login-form'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

test('login form submits credentials', async () => {
  render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>
  )
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' },
  })
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' },
  })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  
  await screen.findByText(/welcome/i)
})
```

## 📱 Responsive Design

### Breakpoint Strategy

**Tailwind Breakpoints:**
- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up
- `2xl`: 1536px and up

**Responsive Patterns:**
```typescript
// Responsive component example
const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <Card.Header>
          <CardTitle>Housing Trends</CardTitle>
        </Card.Header>
        <Card.Content>
          <TrendsChart />
        </Card.Content>
      </Card>
    </div>
  )
}
```

## 🚀 Performance Optimization

### Optimization Strategies

**Code Splitting:**
```typescript
// Dynamic imports for code splitting
const MapView = dynamic(() => import('./map-view'), {
  loading: () => <MapSkeleton />,
  ssr: false, // Disable SSR for map components
})

const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <ChartSkeleton />,
})
```

**Image Optimization:**
```typescript
import Image from 'next/image'

// Optimized image component
<Image
  src="/hero-image.jpg"
  alt="Housing trends dashboard"
  width={1200}
  height={600}
  priority // Preload for above-the-fold images
  className="rounded-lg"
/>
```

**Bundle Analysis:**
```bash
# Analyze bundle size
npm run build
npm run analyze
```

---

**This frontend architecture provides a solid foundation for building scalable, maintainable, and performant React applications with excellent developer experience.**
