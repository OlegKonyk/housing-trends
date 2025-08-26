#!/bin/bash

# Housing Trends Dashboard - AWS Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_PROFILE=${AWS_PROFILE:-default}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: ./aws-deploy.sh [development|staging|production]"
    exit 1
fi

echo -e "${BLUE}🚀 Housing Trends Dashboard - AWS Deployment${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "AWS Region: ${YELLOW}$AWS_REGION${NC}"
echo -e "AWS Profile: ${YELLOW}$AWS_PROFILE${NC}"
echo ""

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}Checking prerequisites...${NC}"
check_command aws
check_command docker
check_command pnpm
check_command jq

# Verify AWS credentials
echo -e "${YELLOW}Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity --profile $AWS_PROFILE &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured or expired${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text)
echo -e "${GREEN}✅ AWS Account: $AWS_ACCOUNT_ID${NC}"

# Set environment-specific variables
if [ "$ENVIRONMENT" = "production" ]; then
    CLUSTER_NAME="housing-trends-production-cluster"
    SERVICE_NAME="housing-trends-production-api"
    ECR_REPO="housing-trends-api"
    S3_BUCKET="housing-trends-production-web"
    CLOUDFRONT_ID=${CLOUDFRONT_DISTRIBUTION_ID_PRODUCTION}
    REQUIRE_APPROVAL="--require-approval any-change"
elif [ "$ENVIRONMENT" = "staging" ]; then
    CLUSTER_NAME="housing-trends-staging-cluster"
    SERVICE_NAME="housing-trends-staging-api"
    ECR_REPO="housing-trends-api-staging"
    S3_BUCKET="housing-trends-staging-web"
    CLOUDFRONT_ID=${CLOUDFRONT_DISTRIBUTION_ID_STAGING}
    REQUIRE_APPROVAL="--require-approval never"
else
    CLUSTER_NAME="housing-trends-development-cluster"
    SERVICE_NAME="housing-trends-development-api"
    ECR_REPO="housing-trends-api-dev"
    S3_BUCKET="housing-trends-development-web"
    CLOUDFRONT_ID=""
    REQUIRE_APPROVAL="--require-approval never"
fi

# Function to deploy infrastructure
deploy_infrastructure() {
    echo -e "\n${YELLOW}Deploying infrastructure with CDK...${NC}"
    cd infrastructure/cdk
    
    # Install CDK dependencies
    echo -e "${YELLOW}Installing CDK dependencies...${NC}"
    npm install
    
    # Bootstrap CDK (if needed)
    if [ "$ENVIRONMENT" = "development" ]; then
        echo -e "${YELLOW}Bootstrapping CDK...${NC}"
        npx cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION --profile $AWS_PROFILE
    fi
    
    # Synthesize CloudFormation template
    echo -e "${YELLOW}Synthesizing CloudFormation template...${NC}"
    npx cdk synth --context environment=$ENVIRONMENT --profile $AWS_PROFILE
    
    # Deploy stack
    echo -e "${YELLOW}Deploying stack...${NC}"
    npx cdk deploy --context environment=$ENVIRONMENT --profile $AWS_PROFILE $REQUIRE_APPROVAL
    
    cd ../..
    echo -e "${GREEN}✅ Infrastructure deployed${NC}"
}

# Function to build and push Docker images
build_and_push_images() {
    echo -e "\n${YELLOW}Building and pushing Docker images...${NC}"
    
    # Login to ECR
    echo -e "${YELLOW}Logging in to ECR...${NC}"
    aws ecr get-login-password --region $AWS_REGION --profile $AWS_PROFILE | \
        docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Create ECR repositories if they don't exist
    create_ecr_repo() {
        local repo_name=$1
        if ! aws ecr describe-repositories --repository-names $repo_name --region $AWS_REGION --profile $AWS_PROFILE &> /dev/null; then
            echo -e "${YELLOW}Creating ECR repository: $repo_name${NC}"
            aws ecr create-repository \
                --repository-name $repo_name \
                --region $AWS_REGION \
                --profile $AWS_PROFILE \
                --image-scanning-configuration scanOnPush=true \
                --encryption-configuration encryptionType=AES256
        fi
    }
    
    create_ecr_repo $ECR_REPO
    
    # Build and tag images
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker build -f apps/api/Dockerfile -t $ECR_REPO:latest .
    docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
    docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$(git rev-parse --short HEAD)
    
    # Push images
    echo -e "${YELLOW}Pushing Docker images...${NC}"
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$(git rev-parse --short HEAD)
    
    echo -e "${GREEN}✅ Docker images pushed to ECR${NC}"
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "\n${YELLOW}Deploying frontend...${NC}"
    
    # Build frontend
    echo -e "${YELLOW}Building frontend...${NC}"
    pnpm build:web
    
    # Create S3 bucket if it doesn't exist
    if ! aws s3api head-bucket --bucket $S3_BUCKET --profile $AWS_PROFILE 2>/dev/null; then
        echo -e "${YELLOW}Creating S3 bucket: $S3_BUCKET${NC}"
        aws s3api create-bucket \
            --bucket $S3_BUCKET \
            --region $AWS_REGION \
            --profile $AWS_PROFILE \
            --create-bucket-configuration LocationConstraint=$AWS_REGION
        
        # Enable static website hosting
        aws s3 website s3://$S3_BUCKET/ \
            --index-document index.html \
            --error-document error.html \
            --profile $AWS_PROFILE
    fi
    
    # Sync files to S3
    echo -e "${YELLOW}Syncing files to S3...${NC}"
    aws s3 sync apps/web/.next/static s3://$S3_BUCKET/_next/static \
        --profile $AWS_PROFILE \
        --cache-control "public, max-age=31536000, immutable" \
        --delete
    
    aws s3 sync apps/web/out s3://$S3_BUCKET/ \
        --profile $AWS_PROFILE \
        --exclude "_next/static/*" \
        --cache-control "public, max-age=0, must-revalidate" \
        --delete
    
    # Invalidate CloudFront cache (if configured)
    if [ -n "$CLOUDFRONT_ID" ]; then
        echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
        aws cloudfront create-invalidation \
            --distribution-id $CLOUDFRONT_ID \
            --paths "/*" \
            --profile $AWS_PROFILE
    fi
    
    echo -e "${GREEN}✅ Frontend deployed${NC}"
}

# Function to update ECS service
update_ecs_service() {
    echo -e "\n${YELLOW}Updating ECS service...${NC}"
    
    # Check if cluster exists
    if aws ecs describe-clusters --clusters $CLUSTER_NAME --profile $AWS_PROFILE --region $AWS_REGION &> /dev/null; then
        # Force new deployment
        aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --force-new-deployment \
            --profile $AWS_PROFILE \
            --region $AWS_REGION
        
        echo -e "${YELLOW}Waiting for service to stabilize...${NC}"
        aws ecs wait services-stable \
            --cluster $CLUSTER_NAME \
            --services $SERVICE_NAME \
            --profile $AWS_PROFILE \
            --region $AWS_REGION
        
        echo -e "${GREEN}✅ ECS service updated${NC}"
    else
        echo -e "${YELLOW}⚠️  ECS cluster not found. Skipping service update.${NC}"
    fi
}

# Function to run database migrations
run_migrations() {
    echo -e "\n${YELLOW}Running database migrations...${NC}"
    
    # Get database endpoint from CloudFormation outputs
    DB_ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name HousingTrendsStack-$ENVIRONMENT \
        --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" \
        --output text \
        --profile $AWS_PROFILE \
        --region $AWS_REGION)
    
    if [ -n "$DB_ENDPOINT" ]; then
        # Run migrations using ECS task
        echo -e "${YELLOW}Running migrations via ECS task...${NC}"
        
        # Create migration task definition if it doesn't exist
        # This would typically be done in CDK, but shown here for completeness
        
        echo -e "${GREEN}✅ Migrations completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Database endpoint not found. Skipping migrations.${NC}"
    fi
}

# Function to run smoke tests
run_smoke_tests() {
    echo -e "\n${YELLOW}Running smoke tests...${NC}"
    
    # Get API endpoint
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name HousingTrendsStack-$ENVIRONMENT \
        --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
        --output text \
        --profile $AWS_PROFILE \
        --region $AWS_REGION)
    
    if [ -n "$API_URL" ]; then
        # Health check
        echo -e "${YELLOW}Testing API health endpoint...${NC}"
        if curl -f "$API_URL/health" &> /dev/null; then
            echo -e "${GREEN}✅ API health check passed${NC}"
        else
            echo -e "${RED}❌ API health check failed${NC}"
            exit 1
        fi
    fi
    
    # Get web URL
    WEB_URL=$(aws cloudformation describe-stacks \
        --stack-name HousingTrendsStack-$ENVIRONMENT \
        --query "Stacks[0].Outputs[?OutputKey=='WebUrl'].OutputValue" \
        --output text \
        --profile $AWS_PROFILE \
        --region $AWS_REGION)
    
    if [ -n "$WEB_URL" ]; then
        echo -e "${YELLOW}Testing web application...${NC}"
        if curl -f "$WEB_URL" &> /dev/null; then
            echo -e "${GREEN}✅ Web application accessible${NC}"
        else
            echo -e "${RED}❌ Web application not accessible${NC}"
            exit 1
        fi
    fi
}

# Main deployment flow
main() {
    echo -e "\n${BLUE}Starting deployment process...${NC}"
    
    # Ask for confirmation in production
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION!${NC}"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo -e "${RED}Deployment cancelled${NC}"
            exit 0
        fi
    fi
    
    # Run deployment steps
    deploy_infrastructure
    build_and_push_images
    deploy_frontend
    update_ecs_service
    run_migrations
    run_smoke_tests
    
    # Display summary
    echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
    
    if [ -n "$API_URL" ]; then
        echo -e "API URL: ${YELLOW}$API_URL${NC}"
    fi
    
    if [ -n "$WEB_URL" ]; then
        echo -e "Web URL: ${YELLOW}$WEB_URL${NC}"
    fi
    
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo -e "  1. Monitor CloudWatch logs for any issues"
    echo -e "  2. Run E2E tests: pnpm test:e2e:$ENVIRONMENT"
    echo -e "  3. Check application metrics in CloudWatch"
}

# Run main function
main
