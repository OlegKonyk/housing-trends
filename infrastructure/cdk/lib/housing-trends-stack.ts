import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export interface HousingTrendsStackProps extends cdk.StackProps {
  environment: 'development' | 'staging' | 'production';
  domainName?: string;
  alertEmail?: string;
}

export class HousingTrendsStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly database: rds.DatabaseInstance;
  public readonly cache: elasticache.CfnCacheCluster;
  public readonly apiService: ecsPatterns.ApplicationLoadBalancedFargateService;
  public readonly webBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: HousingTrendsStackProps) {
    super(scope, id, props);

    const { environment, domainName, alertEmail } = props;
    const isProd = environment === 'production';

    // =================
    // VPC Configuration
    // =================
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `housing-trends-${environment}-vpc`,
      maxAzs: isProd ? 3 : 2,
      natGateways: isProd ? 2 : 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });

    // VPC Endpoints for AWS services (cost optimization)
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // =================
    // Security Groups
    // =================
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ElastiCache',
      allowAllOutbound: false,
    });

    const apiSecurityGroup = new ec2.SecurityGroup(this, 'ApiSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for API service',
      allowAllOutbound: true,
    });

    // Security group rules
    dbSecurityGroup.addIngressRule(
      apiSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from API'
    );

    cacheSecurityGroup.addIngressRule(
      apiSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis access from API'
    );

    // =================
    // Secrets Manager
    // =================
    const dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `housing-trends-${environment}-db-secret`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    const apiSecret = new secretsmanager.Secret(this, 'ApiSecret', {
      secretName: `housing-trends-${environment}-api-secret`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          JWT_SECRET: '',
          HUD_API_KEY: '',
          CENSUS_API_KEY: '',
          FRED_API_KEY: '',
        }),
        generateStringKey: 'JWT_SECRET',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 64,
      },
    });

    // =================
    // RDS PostgreSQL
    // =================
    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `housing-trends-${environment}-db`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        isProd ? ec2.InstanceSize.MEDIUM : ec2.InstanceSize.MICRO
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      multiAz: isProd,
      allocatedStorage: isProd ? 100 : 20,
      maxAllocatedStorage: isProd ? 500 : 100,
      storageEncrypted: true,
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'housing_trends',
      backupRetention: cdk.Duration.days(isProd ? 30 : 7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: isProd,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // =================
    // ElastiCache Redis
    // =================
    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      description: `Subnet group for ${environment} Redis cache`,
      subnetIds: this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds,
      cacheSubnetGroupName: `housing-trends-${environment}-cache-subnet`,
    });

    this.cache = new elasticache.CfnCacheCluster(this, 'RedisCache', {
      cacheNodeType: isProd ? 'cache.r6g.large' : 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      clusterName: `housing-trends-${environment}-cache`,
      vpcSecurityGroupIds: [cacheSecurityGroup.securityGroupId],
      cacheSubnetGroupName: cacheSubnetGroup.cacheSubnetGroupName,
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
      snapshotRetentionLimit: isProd ? 7 : 1,
      snapshotWindow: '03:00-05:00',
    });

    // =================
    // ECS Cluster
    // =================
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `housing-trends-${environment}-cluster`,
      vpc: this.vpc,
      containerInsights: true,
    });

    // =================
    // API Service (Fargate)
    // =================
    const apiTaskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      family: `housing-trends-${environment}-api`,
      memoryLimitMiB: isProd ? 2048 : 512,
      cpu: isProd ? 1024 : 256,
    });

    // Add container to task definition
    const apiContainer = apiTaskDefinition.addContainer('api', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:20-alpine'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      environment: {
        NODE_ENV: environment,
        PORT: '3001',
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret, 'connectionString'),
        JWT_SECRET: ecs.Secret.fromSecretsManager(apiSecret, 'JWT_SECRET'),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3001/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
    });

    apiContainer.addPortMappings({
      containerPort: 3001,
      protocol: ecs.Protocol.TCP,
    });

    // Create Fargate service with ALB
    this.apiService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'ApiService', {
      cluster: this.cluster,
      serviceName: `housing-trends-${environment}-api`,
      taskDefinition: apiTaskDefinition,
      desiredCount: isProd ? 2 : 1,
      assignPublicIp: false,
      securityGroups: [apiSecurityGroup],
      healthCheckGracePeriod: cdk.Duration.seconds(60),
    });

    // Configure auto-scaling
    const scaling = this.apiService.service.autoScaleTaskCount({
      minCapacity: isProd ? 2 : 1,
      maxCapacity: isProd ? 10 : 3,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 75,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // =================
    // S3 Buckets
    // =================
    this.webBucket = new s3.Bucket(this, 'WebBucket', {
      bucketName: `housing-trends-${environment}-web`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      versioned: isProd,
      lifecycleRules: isProd ? [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ] : [],
    });

    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `housing-trends-${environment}-data`,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      versioned: true,
      lifecycleRules: [
        {
          id: 'archive-old-data',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // =================
    // CloudFront Distribution
    // =================
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.webBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(
            this.apiService.loadBalancer.loadBalancerDnsName,
            {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            }
          ),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
      domainNames: domainName ? [domainName] : undefined,
      priceClass: isProd 
        ? cloudfront.PriceClass.PRICE_CLASS_ALL 
        : cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // Grant CloudFront access to S3
    this.webBucket.grantRead(originAccessIdentity);

    // =================
    // SQS Queues
    // =================
    const emailQueue = new sqs.Queue(this, 'EmailQueue', {
      queueName: `housing-trends-${environment}-email-queue`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'EmailDLQ', {
          queueName: `housing-trends-${environment}-email-dlq`,
        }),
        maxReceiveCount: 3,
      },
    });

    // =================
    // Lambda Functions
    // =================
    const emailProcessor = new lambdaNodeJs.NodejsFunction(this, 'EmailProcessor', {
      functionName: `housing-trends-${environment}-email-processor`,
      entry: 'apps/functions/email-processor/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      environment: {
        QUEUE_URL: emailQueue.queueUrl,
        ENVIRONMENT: environment,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: isProd ? 512 : 256,
    });

    emailQueue.grantConsumeMessages(emailProcessor);

    // Data sync Lambda
    const dataSync = new lambdaNodeJs.NodejsFunction(this, 'DataSync', {
      functionName: `housing-trends-${environment}-data-sync`,
      entry: 'apps/functions/data-sync/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      environment: {
        DATABASE_URL: dbSecret.secretValueFromJson('connectionString').unsafeUnwrap(),
        REDIS_URL: `redis://${this.cache.attrRedisEndpointAddress}:${this.cache.attrRedisEndpointPort}`,
        DATA_BUCKET: dataBucket.bucketName,
      },
      timeout: cdk.Duration.minutes(15),
      memorySize: isProd ? 1024 : 512,
    });

    dataBucket.grantReadWrite(dataSync);

    // Schedule data sync
    const dataSyncRule = new events.Rule(this, 'DataSyncSchedule', {
      ruleName: `housing-trends-${environment}-data-sync`,
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2',
        weekDay: 'MON',
      }),
    });

    dataSyncRule.addTarget(new targets.LambdaFunction(dataSync));

    // =================
    // CloudWatch Alarms
    // =================
    if (alertEmail) {
      const alertTopic = new sns.Topic(this, 'AlertTopic', {
        topicName: `housing-trends-${environment}-alerts`,
      });

      alertTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(alertEmail)
      );

      // Database CPU alarm
      new cloudwatch.Alarm(this, 'DatabaseCpuAlarm', {
        metric: this.database.metricCPUUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
      }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

      // API service CPU alarm
      new cloudwatch.Alarm(this, 'ApiCpuAlarm', {
        metric: this.apiService.service.metricCpuUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
      }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

      // API 5xx errors alarm
      new cloudwatch.Alarm(this, 'Api5xxAlarm', {
        metric: this.apiService.loadBalancer.metricHttpCodeTarget(
          ecs.HttpCodeTarget.TARGET_5XX_COUNT
        ),
        threshold: 10,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));
    }

    // =================
    // Outputs
    // =================
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `https://${this.apiService.loadBalancer.loadBalancerDnsName}`,
      description: 'API Load Balancer URL',
    });

    new cdk.CfnOutput(this, 'WebUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'CacheEndpoint', {
      value: this.cache.attrRedisEndpointAddress,
      description: 'ElastiCache Redis Endpoint',
    });

    // =================
    // Tags
    // =================
    cdk.Tags.of(this).add('Project', 'housing-trends');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
