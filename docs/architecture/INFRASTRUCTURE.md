# ☁️ Infrastructure Architecture

## 🎯 Infrastructure Design Philosophy

The infrastructure is built with **Infrastructure as Code (IaC)** and **AWS cloud services** to ensure:

- **Scalability**: Auto-scaling capabilities for varying workloads
- **Reliability**: High availability with multi-AZ deployments
- **Security**: Defense in depth with multiple security layers
- **Cost Optimization**: Right-sized resources with monitoring
- **Compliance**: Built-in security and compliance features
- **Maintainability**: Version-controlled infrastructure code

## 🏗️ Infrastructure Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Cloud Infrastructure                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Route 53  │  │ CloudFront  │  │   WAF       │            │
│  │ (DNS &      │  │ (CDN &      │  │ (Security   │            │
│  │  Routing)   │  │  Caching)   │  │   Layer)    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Application │  │ Application │  │   Auto      │            │
│  │ Load        │  │ Load        │  │  Scaling    │            │
│  │ Balancer    │  │ Balancer    │  │   Group     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   ECS       │  │   ECS       │  │   ECS       │            │
│  │  Fargate    │  │  Fargate    │  │  Fargate    │            │
│  │ (Frontend)  │  │ (Backend)   │  │ (Workers)   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   RDS       │  │ ElastiCache │  │     S3      │            │
│  │ PostgreSQL  │  │   Redis     │  │ (Static     │            │
│  │ (Database)  │  │  (Cache)    │  │  Assets)    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   VPC       │  │   VPC       │  │   VPC       │            │
│  │ (Public     │  │ (Private    │  │ (Database   │            │
│  │  Subnets)   │  │  Subnets)   │  │  Subnets)   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack Deep Dive

### Infrastructure as Code: AWS CDK

**Why AWS CDK?**
- **TypeScript Support**: Full TypeScript integration with type safety
- **Object-Oriented**: Reusable components and patterns
- **CloudFormation**: Generates CloudFormation templates automatically
- **Testing**: Unit testing for infrastructure code
- **Version Control**: Git-based infrastructure management

**CDK Stack Structure:**
```typescript
// Main CDK app
import * as cdk from 'aws-cdk-lib';
import { HousingTrendsStack } from './lib/housing-trends-stack';

const app = new cdk.App();

new HousingTrendsStack(app, 'HousingTrendsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  environment: process.env.ENVIRONMENT || 'development',
});
```

### Container Orchestration: ECS Fargate

**Why ECS Fargate?**
- **Serverless**: No EC2 instance management required
- **Auto Scaling**: Automatic scaling based on demand
- **Cost Effective**: Pay only for resources used
- **Security**: Built-in security with task execution roles
- **Integration**: Native AWS service integration

**ECS Service Configuration:**
```typescript
// ECS Fargate service definition
const backendService = new ecs.FargateService(this, 'BackendService', {
  cluster,
  taskDefinition: backendTaskDef,
  desiredCount: 2,
  minHealthyPercent: 50,
  maxHealthyPercent: 200,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  securityGroups: [backendSecurityGroup],
  serviceName: 'housing-trends-backend',
  enableExecuteCommand: true,
});

// Auto scaling
const scaling = backendService.autoScaleTaskCount({
  minCapacity: 2,
  maxCapacity: 10,
});

scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,
  scaleInCooldown: cdk.Duration.seconds(60),
  scaleOutCooldown: cdk.Duration.seconds(60),
});
```

### Database: Amazon RDS PostgreSQL

**Why RDS PostgreSQL?**
- **Managed Service**: Automated backups, patching, and monitoring
- **High Availability**: Multi-AZ deployment with automatic failover
- **Security**: Encryption at rest and in transit
- **Performance**: Read replicas for read-heavy workloads
- **Compliance**: Built-in compliance features

**RDS Configuration:**
```typescript
// RDS PostgreSQL instance
const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15,
  }),
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  allocatedStorage: 20,
  maxAllocatedStorage: 100,
  storageEncrypted: true,
  backupRetention: cdk.Duration.days(7),
  deletionProtection: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
  securityGroups: [databaseSecurityGroup],
  credentials: rds.Credentials.fromGeneratedSecret('postgres'),
  databaseName: 'housing_trends',
  parameterGroup: new rds.ParameterGroup(this, 'ParameterGroup', {
    engine: rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.VER_15,
    }),
    parameters: {
      'max_connections': '100',
      'shared_preload_libraries': 'pg_stat_statements',
    },
  }),
});
```

### Caching: Amazon ElastiCache Redis

**Why ElastiCache Redis?**
- **Managed Service**: Automated maintenance and monitoring
- **High Performance**: Sub-millisecond response times
- **Scalability**: Cluster mode for horizontal scaling
- **Security**: VPC isolation and encryption
- **Monitoring**: CloudWatch integration

**Redis Configuration:**
```typescript
// ElastiCache Redis cluster
const redis = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
  engine: 'redis',
  cacheNodeType: 'cache.t3.micro',
  numCacheNodes: 1,
  vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
  cacheSubnetGroupName: redisSubnetGroup.ref,
  port: 6379,
  preferredMaintenanceWindow: 'sun:05:00-sun:09:00',
  snapshotRetentionLimit: 7,
  snapshotWindow: '03:00-05:00',
});
```

### Content Delivery: Amazon CloudFront

**Why CloudFront?**
- **Global CDN**: Content delivery worldwide
- **Performance**: Reduced latency and improved load times
- **Security**: DDoS protection and SSL/TLS termination
- **Cost Optimization**: Reduced origin server load
- **Caching**: Intelligent caching strategies

**CloudFront Distribution:**
```typescript
// CloudFront distribution
const distribution = new cloudfront.Distribution(this, 'Distribution', {
  defaultBehavior: {
    origin: new origins.S3Origin(websiteBucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
    responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
  },
  additionalBehaviors: {
    '/api/*': {
      origin: new origins.LoadBalancerV2Origin(loadBalancer, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      }),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
    },
  },
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
    },
  ],
});
```

## 📦 Infrastructure Components

### Networking: Amazon VPC

**VPC Architecture:**
```typescript
// VPC with public and private subnets
const vpc = new ec2.Vpc(this, 'HousingTrendsVPC', {
  maxAzs: 2,
  natGateways: 1,
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
    },
    {
      cidrMask: 24,
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    },
    {
      cidrMask: 24,
      name: 'Database',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    },
  ],
  gatewayEndpoints: {
    S3: {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    },
  },
});
```

### Security Groups

**Security Group Configuration:**
```typescript
// Load balancer security group
const loadBalancerSecurityGroup = new ec2.SecurityGroup(this, 'LoadBalancerSG', {
  vpc,
  description: 'Security group for Application Load Balancer',
  allowAllOutbound: true,
});

loadBalancerSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(80),
  'Allow HTTP traffic'
);

loadBalancerSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(443),
  'Allow HTTPS traffic'
);

// Backend service security group
const backendSecurityGroup = new ec2.SecurityGroup(this, 'BackendSG', {
  vpc,
  description: 'Security group for backend services',
  allowAllOutbound: true,
});

backendSecurityGroup.addIngressRule(
  loadBalancerSecurityGroup,
  ec2.Port.tcp(3000),
  'Allow traffic from load balancer'
);

// Database security group
const databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSG', {
  vpc,
  description: 'Security group for RDS database',
  allowAllOutbound: false,
});

databaseSecurityGroup.addIngressRule(
  backendSecurityGroup,
  ec2.Port.tcp(5432),
  'Allow PostgreSQL access from backend'
);
```

### Load Balancing: Application Load Balancer

**ALB Configuration:**
```typescript
// Application Load Balancer
const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
  vpc,
  internetFacing: true,
  securityGroup: loadBalancerSecurityGroup,
  vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
});

// Target groups
const backendTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BackendTargetGroup', {
  vpc,
  port: 3000,
  protocol: elbv2.ApplicationProtocol.HTTP,
  targetType: elbv2.TargetType.IP,
  healthCheck: {
    path: '/health',
    healthyHttpCodes: '200',
    interval: cdk.Duration.seconds(30),
    timeout: cdk.Duration.seconds(5),
    healthyThresholdCount: 2,
    unhealthyThresholdCount: 3,
  },
});

// Listeners
const httpsListener = loadBalancer.addListener('HTTPSListener', {
  port: 443,
  protocol: elbv2.ApplicationProtocol.HTTPS,
  certificates: [certificate],
  defaultAction: elbv2.ListenerAction.forward([backendTargetGroup]),
});
```

## 🔄 Deployment Architecture

### CI/CD Pipeline: GitHub Actions

**Pipeline Configuration:**
```yaml
# .github/workflows/aws-deploy.yml
name: AWS CI/CD Pipeline

on:
  push:
    branches: [main, develop, staging]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build applications
        run: npm run build

      - name: Build Docker images
        run: |
          docker build -t housing-trends-frontend ./apps/web
          docker build -t housing-trends-backend ./apps/api

      - name: Push to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
          docker tag housing-trends-frontend:latest ${{ secrets.ECR_REGISTRY }}/housing-trends-frontend:latest
          docker tag housing-trends-backend:latest ${{ secrets.ECR_REGISTRY }}/housing-trends-backend:latest
          docker push ${{ secrets.ECR_REGISTRY }}/housing-trends-frontend:latest
          docker push ${{ secrets.ECR_REGISTRY }}/housing-trends-backend:latest

      - name: Deploy to AWS
        run: |
          cd infrastructure/cdk
          npm ci
          npx cdk deploy --require-approval never
```

### Environment Strategy

**Multi-Environment Setup:**
```typescript
// Environment-specific configurations
interface EnvironmentConfig {
  environment: string;
  domain: string;
  certificateArn: string;
  databaseInstanceClass: string;
  desiredCount: number;
  maxCapacity: number;
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    environment: 'development',
    domain: 'dev.housingtrends.com',
    certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/dev-cert',
    databaseInstanceClass: 'db.t3.micro',
    desiredCount: 1,
    maxCapacity: 2,
  },
  staging: {
    environment: 'staging',
    domain: 'staging.housingtrends.com',
    certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/staging-cert',
    databaseInstanceClass: 'db.t3.small',
    desiredCount: 2,
    maxCapacity: 4,
  },
  production: {
    environment: 'production',
    domain: 'housingtrends.com',
    certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/prod-cert',
    databaseInstanceClass: 'db.t3.medium',
    desiredCount: 3,
    maxCapacity: 10,
  },
};
```

## 🛡️ Security Architecture

### Network Security

**VPC Security:**
- **Private Subnets**: Application services in private subnets
- **Database Subnets**: Database in isolated subnets
- **NAT Gateway**: Outbound internet access for private resources
- **Security Groups**: Fine-grained access control
- **Network ACLs**: Additional network layer security

### Application Security

**Security Headers:**
```typescript
// Security headers policy
const securityHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeaders', {
  responseHeadersPolicyName: 'SecurityHeadersPolicy',
  comment: 'Security headers for housing trends application',
  securityHeadersBehavior: {
    contentSecurityPolicy: {
      override: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    },
    contentTypeOptions: {
      override: true,
    },
    frameOptions: {
      override: true,
      frameOption: cloudfront.HeadersFrameOption.DENY,
    },
    referrerPolicy: {
      override: true,
      referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
    },
    strictTransportSecurity: {
      override: true,
      accessControlMaxAge: cdk.Duration.seconds(31536000),
      includeSubdomains: true,
      preload: true,
    },
    xssProtection: {
      override: true,
      protection: true,
      modeBlock: true,
    },
  },
});
```

### Data Security

**Encryption:**
- **At Rest**: All data encrypted with AWS KMS
- **In Transit**: TLS 1.2+ for all communications
- **Database**: RDS encryption with customer-managed keys
- **S3**: Server-side encryption for all objects
- **Secrets**: AWS Secrets Manager for sensitive data

## 📊 Monitoring & Observability

### CloudWatch Monitoring

**Application Metrics:**
```typescript
// CloudWatch dashboard
const dashboard = new cloudwatch.Dashboard(this, 'HousingTrendsDashboard', {
  dashboardName: 'HousingTrends-Monitoring',
  widgets: [
    [
      new cloudwatch.GraphWidget({
        title: 'Application Performance',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'TargetResponseTime',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'RequestCount',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
    ],
    [
      new cloudwatch.GraphWidget({
        title: 'Database Performance',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'CPUUtilization',
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
    ],
  ],
});
```

### Logging Strategy

**Centralized Logging:**
```typescript
// CloudWatch log groups
const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogs', {
  logGroupName: '/aws/ecs/housing-trends',
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

const databaseLogGroup = new logs.LogGroup(this, 'DatabaseLogs', {
  logGroupName: '/aws/rds/housing-trends',
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

## 💰 Cost Optimization

### Resource Optimization

**Right-Sizing Strategy:**
- **Development**: Minimal resources for cost efficiency
- **Staging**: Medium resources for testing
- **Production**: Optimized resources for performance

**Auto Scaling:**
```typescript
// Cost-optimized auto scaling
const scaling = backendService.autoScaleTaskCount({
  minCapacity: 1,
  maxCapacity: 5,
});

scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,
  scaleInCooldown: cdk.Duration.seconds(300), // 5 minutes
  scaleOutCooldown: cdk.Duration.seconds(60),  // 1 minute
});

scaling.scaleOnMemoryUtilization('MemoryScaling', {
  targetUtilizationPercent: 80,
  scaleInCooldown: cdk.Duration.seconds(300),
  scaleOutCooldown: cdk.Duration.seconds(60),
});
```

### Cost Monitoring

**Cost Alerts:**
```typescript
// CloudWatch cost anomaly detection
const costAnomalyTopic = new sns.Topic(this, 'CostAnomalyTopic');

new cloudwatch.Alarm(this, 'CostAnomalyAlarm', {
  metric: new cloudwatch.Metric({
    namespace: 'AWS/Billing',
    metricName: 'EstimatedCharges',
    statistic: 'Maximum',
    period: cdk.Duration.hours(6),
  }),
  threshold: 100, // $100 threshold
  evaluationPeriods: 1,
  alarmDescription: 'Cost anomaly detected',
  actionsEnabled: true,
  alarmActions: [costAnomalyTopic],
});
```

## 🚀 Disaster Recovery

### Backup Strategy

**Automated Backups:**
- **Database**: Daily automated backups with 7-day retention
- **Application**: Docker images stored in ECR
- **Configuration**: Infrastructure as Code in Git
- **Data**: S3 versioning for critical data

### Recovery Procedures

**Recovery Time Objectives (RTO):**
- **Development**: 1 hour
- **Staging**: 30 minutes
- **Production**: 15 minutes

**Recovery Point Objectives (RPO):**
- **Database**: 1 hour (automated backups)
- **Application**: 0 minutes (container images)
- **Configuration**: 0 minutes (Git version control)

---

**This infrastructure architecture provides a robust, scalable, and secure foundation for the housing trends dashboard with comprehensive monitoring, cost optimization, and disaster recovery capabilities.**
