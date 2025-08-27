import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync, IsOptional, IsUrl } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @IsOptional()
  API_PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  REDIS_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string;

  @IsString()
  @IsOptional()
  REFRESH_TOKEN_SECRET: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_WINDOW_MS: number;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_MAX_REQUESTS: number;

  @IsString()
  @IsOptional()
  HUD_API_KEY: string;

  @IsString()
  @IsOptional()
  CENSUS_API_KEY: string;

  @IsString()
  @IsOptional()
  FRED_API_KEY: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
