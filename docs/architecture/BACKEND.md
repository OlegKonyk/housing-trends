# 🔧 Backend Architecture

## 🎯 Backend Design Philosophy

The backend is built with **NestJS framework** and **TypeScript-first development** to ensure:

- **Modularity**: Clear separation of concerns with module-based architecture
- **Type Safety**: Full TypeScript coverage with strict typing
- **Scalability**: Microservices-ready architecture with dependency injection
- **Testability**: Built-in testing capabilities with dependency injection
- **Security**: Authentication, authorization, and data validation by design
- **Performance**: Efficient database queries, caching, and background processing

## 🏗️ Backend Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS Application                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Controllers │  │   Services  │  │   Guards    │            │
│  │ (HTTP Layer)│  │ (Business   │  │ (Auth &     │            │
│  │             │  │   Logic)    │  │  Security)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Modules   │  │   DTOs      │  │  Interceptors│            │
│  │ (Feature    │  │ (Data       │  │ (Request/   │            │
│  │  Groups)    │  │  Transfer)  │  │  Response)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Database  │  │    Cache    │  │   External  │            │
│  │ (Prisma     │  │   (Redis)   │  │     APIs    │            │
│  │   ORM)      │  │             │  │  (HUD,      │            │
│  │             │  │             │  │   Census)   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack Deep Dive

### Core Framework: NestJS

**Why NestJS?**
- **TypeScript-First**: Built with TypeScript from the ground up
- **Dependency Injection**: Built-in IoC container for better testability
- **Modular Architecture**: Clear separation of concerns with modules
- **Decorators**: Clean, declarative code with metadata
- **Built-in Validation**: Request validation with class-validator
- **OpenAPI Support**: Automatic Swagger documentation generation

**Framework Features:**
```typescript
// Main application bootstrap
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    AuthModule,
    HousingModule,
    SearchModule,
    NotificationsModule,
  ],
})
export class AppModule {}
```

### Database Layer: Prisma ORM

**Why Prisma?**
- **Type Safety**: Auto-generated TypeScript client
- **Schema-First**: Database schema as source of truth
- **Migrations**: Version-controlled database changes
- **Query Builder**: Type-safe database queries
- **Relations**: Automatic relationship handling

**Schema Example:**
```prisma
// Database schema with relationships
model User {
  id                String            @id @default(cuid())
  email             String            @unique
  password          String?
  name              String?
  role              UserRole          @default(USER)
  emailVerified     Boolean           @default(false)
  
  // Relations
  savedSearches     SavedSearch[]
  notifications     Notification[]
  searchHistory     SearchHistory[]
  refreshTokens     RefreshToken[]
  
  @@index([email])
  @@index([role])
}

model SavedSearch {
  id                    String                @id @default(cuid())
  userId                String
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name                  String
  description           String?
  filters               Json
  emailNotifications    Boolean               @default(false)
  notificationFrequency NotificationFrequency @default(WEEKLY)
  
  @@index([userId])
}
```

### Caching Layer: Redis

**Why Redis?**
- **In-Memory Performance**: Sub-millisecond response times
- **Data Structures**: Strings, hashes, lists, sets, sorted sets
- **Persistence**: Optional disk persistence
- **Pub/Sub**: Real-time messaging capabilities
- **Session Storage**: Perfect for user sessions

**Redis Integration:**
```typescript
// Redis configuration
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: 60 * 60, // 1 hour default TTL
      }),
    }),
  ],
})
export class CacheModule {}
```

### Job Queue: BullMQ

**Why BullMQ?**
- **Redis-Based**: Reliable job processing with Redis
- **TypeScript Support**: Full TypeScript integration
- **Retry Logic**: Automatic retry with exponential backoff
- **Priority Queues**: Job prioritization
- **Rate Limiting**: Built-in rate limiting capabilities

**Queue Configuration:**
```typescript
// BullMQ queue setup
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
})
export class NotificationsModule {}
```

## 📦 Module Architecture

### Module Structure

**Core Modules:**
```
src/modules/
├── auth/                    # Authentication & Authorization
│   ├── auth.controller.ts   # HTTP endpoints
│   ├── auth.service.ts      # Business logic
│   ├── auth.module.ts       # Module configuration
│   ├── guards/              # Authentication guards
│   ├── strategies/          # Passport strategies
│   └── dto/                 # Data transfer objects
├── search/                  # Search functionality
│   ├── search.controller.ts
│   ├── search.service.ts
│   ├── search.module.ts
│   └── dto/
├── notifications/           # Notification system
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   ├── notifications.module.ts
│   ├── processors/          # Background job processors
│   └── dto/
├── housing/                 # Housing data management
│   ├── housing.controller.ts
│   ├── housing.service.ts
│   ├── housing.module.ts
│   ├── services/            # External API services
│   └── dto/
├── users/                   # User management
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── database/                # Database configuration
│   ├── database.module.ts
│   └── prisma.service.ts
└── health/                  # Health checks
    ├── health.controller.ts
    └── health.module.ts
```

### Module Pattern

**Module Configuration:**
```typescript
@Module({
  imports: [
    // External dependencies
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
```

## 🎭 Controller Layer

### Controller Responsibilities

**HTTP Layer Management:**
```typescript
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @Throttle(5, 300) // Rate limiting
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @HttpCode(HttpStatus.OK)
  @Throttle(10, 60)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.validateUser(user.id);
  }
}
```

### Request/Response Handling

**DTOs for Type Safety:**
```typescript
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(32, { message: 'Password must not exceed 32 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;
}
```

## 🔧 Service Layer

### Service Responsibilities

**Business Logic Implementation:**
```typescript
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex');

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerificationToken: verificationToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  private async generateTokens(user: Partial<User>) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN'),
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return { accessToken, refreshToken };
  }
}
```

## 🛡️ Security Architecture

### Authentication & Authorization

**JWT Strategy:**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
```

**Guards for Route Protection:**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

### Rate Limiting

**Throttler Configuration:**
```typescript
@Injectable()
export class ThrottlerGuard extends ThrottlerGuard {
  protected errorMessage = 'Too many requests';
  
  protected getTracker(req: Record<string, any>): string {
    return req.ips.length ? req.ips[0] : req.ip; // Track by IP
  }
}
```

## 🔄 Data Flow Patterns

### Database Operations

**Prisma Service Pattern:**
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }
    
    const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    try {
      await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.log({ error });
    }
  }
}
```

### Caching Strategy

**Cache Service Pattern:**
```typescript
@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl || 3600);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }
}
```

## 🧪 Testing Architecture

### Testing Strategy

**Unit Testing:**
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
        role: 'USER',
        createdAt: new Date(),
      } as any);

      const result = await service.register(registerDto);

      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.name).toBe(registerDto.name);
    });
  });
});
```

**Integration Testing:**
```typescript
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
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.accessToken).toBeDefined();
        });
    });
  });
});
```

## 📊 Performance Optimization

### Database Optimization

**Query Optimization:**
```typescript
// Optimized query with includes and select
const userWithSearches = await this.prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    savedSearches: {
      select: {
        id: true,
        name: true,
        description: true,
        emailNotifications: true,
        notificationFrequency: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

**Connection Pooling:**
```typescript
// Prisma connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling configuration
  __internal: {
    engine: {
      connectionLimit: 20,
    },
  },
});
```

### Caching Strategy

**Multi-Level Caching:**
```typescript
@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async searchHousingData(filters: SearchFiltersDto) {
    // Generate cache key based on filters
    const cacheKey = `search:${JSON.stringify(filters)}`;
    
    // Try to get from cache first
    const cachedResult = await this.cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // If not in cache, query database
    const results = await this.performSearch(filters);
    
    // Cache results for 5 minutes
    await this.cacheService.set(cacheKey, results, 300);
    
    return results;
  }
}
```

## 🔍 Monitoring & Observability

### Logging Strategy

**Structured Logging:**
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  async searchHousingData(filters: SearchFiltersDto) {
    this.logger.log(`Searching housing data with filters: ${JSON.stringify(filters)}`);
    
    try {
      const results = await this.performSearch(filters);
      this.logger.log(`Search completed. Found ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

### Health Checks

**Health Check Implementation:**
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }
}
```

---

**This backend architecture provides a robust, scalable, and maintainable foundation for the housing trends dashboard API with comprehensive security, performance, and testing capabilities.**
