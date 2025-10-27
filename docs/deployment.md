# Deployment Guide

This guide covers deploying the Cost Estimator to AWS S3 for static website hosting.

## Prerequisites

1. **AWS CLI** installed and configured
2. **Node.js** (v16 or higher)
3. **S3 bucket** created for hosting
4. **IAM permissions** for S3 and CloudFront (optional)

## Environment Setup

### Required Environment Variables

```bash
export S3_BUCKET_NAME=your-bucket-name
```

### Optional Environment Variables

```bash
export AWS_REGION=us-east-1                    # Default region
export CLOUDFRONT_DISTRIBUTION_ID=E1234567890  # For cache invalidation
export DEPLOY_ENVIRONMENT=production           # Environment label
```

## S3 Bucket Configuration

### 1. Create S3 Bucket

```bash
aws s3 mb s3://your-bucket-name --region us-east-1
```

### 2. Enable Static Website Hosting

```bash
aws s3 website s3://your-bucket-name \
  --index-document index.html \
  --error-document index.html
```

### 3. Set Bucket Policy (Public Read)

Create a bucket policy file `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

Apply the policy:

```bash
aws s3api put-bucket-policy \
  --bucket your-bucket-name \
  --policy file://bucket-policy.json
```

## Deployment Process

### 1. Install Dependencies

```bash
npm install
```

### 2. Validate Configuration

```bash
npm run validate-config
```

### 3. Deploy

```bash
# Set environment variables
export S3_BUCKET_NAME=your-bucket-name

# Deploy to S3
npm run deploy
```

Or use the deployment script directly:

```bash
node scripts/deploy.js
```

## CloudFront CDN (Optional)

For better performance and HTTPS support, set up CloudFront:

### 1. Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

Example `cloudfront-config.json`:

```json
{
  "CallerReference": "cost-estimator-2025",
  "Comment": "Cost Estimator CDN",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-your-bucket-name",
        "DomainName": "your-bucket-name.s3-website-us-east-1.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-your-bucket-name",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
```

### 2. Configure Cache Invalidation

```bash
export CLOUDFRONT_DISTRIBUTION_ID=E1234567890
npm run deploy
```

## Custom Domain (Optional)

### 1. Add CNAME Record

Point your domain to the CloudFront distribution:

```
cost-estimator.yourdomain.com CNAME d1234567890.cloudfront.net
```

### 2. Add SSL Certificate

Use AWS Certificate Manager to create an SSL certificate for your domain.

## Environment-Specific Deployments

### Development

```bash
export S3_BUCKET_NAME=cost-estimator-dev
export DEPLOY_ENVIRONMENT=development
npm run deploy
```

### Staging

```bash
export S3_BUCKET_NAME=cost-estimator-staging
export DEPLOY_ENVIRONMENT=staging
npm run deploy
```

### Production

```bash
export S3_BUCKET_NAME=cost-estimator-prod
export DEPLOY_ENVIRONMENT=production
export CLOUDFRONT_DISTRIBUTION_ID=E1234567890
npm run deploy
```

## Troubleshooting

### Common Issues

1. **Access Denied**: Check bucket policy and IAM permissions
2. **Build Failures**: Ensure all dependencies are installed
3. **404 Errors**: Verify bucket website configuration
4. **Cache Issues**: Invalidate CloudFront cache

### Debug Commands

```bash
# Check bucket website configuration
aws s3api get-bucket-website --bucket your-bucket-name

# List bucket contents
aws s3 ls s3://your-bucket-name --recursive

# Test website accessibility
curl -I http://your-bucket-name.s3-website-us-east-1.amazonaws.com
```

## Monitoring and Maintenance

### CloudWatch Metrics

Monitor these metrics:
- S3 bucket requests
- CloudFront cache hit ratio
- Error rates (4xx, 5xx)

### Cost Optimization

1. Use CloudFront for caching
2. Enable S3 request metrics only if needed
3. Consider S3 Transfer Acceleration for global users
4. Use appropriate CloudFront price class

### Security Considerations

1. **HTTPS Only**: Use CloudFront to enforce HTTPS
2. **Access Logs**: Enable S3 and CloudFront logging
3. **WAF**: Consider AWS WAF for protection
4. **Regular Updates**: Keep dependencies updated

## Rollback Procedure

### Quick Rollback

```bash
# Restore previous version from backup
aws s3 sync s3://your-backup-bucket/ s3://your-bucket-name/

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890 \
  --paths "/*"
```

### Backup Strategy

```bash
# Backup current deployment
aws s3 sync s3://your-bucket-name/ s3://your-backup-bucket/$(date +%Y%m%d-%H%M%S)/
```