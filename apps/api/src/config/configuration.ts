export default () => ({
  port: parseInt(process.env.API_PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    url: process.env.REDIS_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  },
  
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  
  cors: {
    origins: process.env.CORS_ORIGINS || 'http://localhost:3000',
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
  },
  
  externalApis: {
    hud: {
      apiKey: process.env.HUD_API_KEY,
      apiUrl: process.env.HUD_API_URL || 'https://www.huduser.gov/hudapi/public',
    },
    census: {
      apiKey: process.env.CENSUS_API_KEY,
      apiUrl: process.env.CENSUS_API_URL || 'https://api.census.gov/data',
    },
    fred: {
      apiKey: process.env.FRED_API_KEY,
      apiUrl: process.env.FRED_API_URL || 'https://api.stlouisfed.org/fred',
    },
  },
  
  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT, 10) || 1025,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@housingtrendsdashboard.com',
  },
  
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
});
