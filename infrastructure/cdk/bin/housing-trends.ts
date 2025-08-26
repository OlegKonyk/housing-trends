#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HousingTrendsStack } from '../lib/housing-trends-stack';

const app = new cdk.App();

// Get environment from context or environment variable
const environment = app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'development';

// Environment-specific configurations
const envConfig = {
  development: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    environment: 'development' as const,
  },
  staging: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION || 'us-east-1',
    environment: 'staging' as const,
    domainName: 'staging.housing-trends.com',
    alertEmail: process.env.ALERT_EMAIL,
  },
  production: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION || 'us-east-1',
    environment: 'production' as const,
    domainName: 'housing-trends.com',
    alertEmail: process.env.ALERT_EMAIL,
  },
};

const config = envConfig[environment as keyof typeof envConfig];

if (!config) {
  throw new Error(`Invalid environment: ${environment}. Must be one of: development, staging, production`);
}

// Create the stack
new HousingTrendsStack(app, `HousingTrendsStack-${environment}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  ...config,
  description: `Housing Trends Dashboard infrastructure for ${environment} environment`,
  tags: {
    Environment: environment,
    Project: 'housing-trends',
    ManagedBy: 'CDK',
    Owner: 'engineering',
    CostCenter: 'product',
  },
});

app.synth();
