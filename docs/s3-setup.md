# S3 Deployment Guide

This guide walks you through setting up AWS S3 for hosting the Cost Estimator and deploying the application.

## Prerequisites

### 1. AWS Account
- Active AWS account with billing enabled
- AWS CLI installed and configured

### 2. AWS CLI Installation

**Windows (PowerShell):**
```powershell
# Using Chocolatey
choco install awscli

# Or download from AWS website
# https://awscli.amazonaws.com/AWSCLIV2.msi
```

**macOS:**
```bash
# Using Homebrew
brew install awscli

# Or using curl
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 3. AWS Credentials Configuration

```bash
aws configure
```

You'll need:
- **AWS Access Key ID**: From your AWS IAM user
- **AWS Secret Access Key**: From your AWS IAM user  
- **Default region**: e.g., `us-east-1`
- **Default output format**: `json`

### 4. Required AWS Permissions

Your AWS user needs these permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucket",
                "s3:GetBucketLocation",
                "s3:GetBucketWebsite",
                "s3:PutBucketWebsite",
                "s3:GetBucketPolicy",
                "s3:PutBucketPolicy",
                "s3:PutBucketPublicAccessBlock",
                "s3:GetBucketPublicAccessBlock",
                "s3:ListBucket",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::*",
                "arn:aws:s3:::*/*"
            ]
        }
    ]
}
```

## Quick Setup (Automated)

### Step 1: Choose a Bucket Name

S3 bucket names must be globally unique. Choose something like:
- `your-company-cost-estimator`
- `cost-estimator-yourname-2025`
- `data-pricing-tool-prod`

### Step 2: Set Environment Variables

```bash
# Required
export S3_BUCKET_NAME=your-unique-bucket-name

# Optional (defaults to us-east-1)
export AWS_REGION=us-east-1
```

**Windows PowerShell:**
```powershell
$env:S3_BUCKET_NAME="your-unique-bucket-name"
$env:AWS_REGION="us-east-1"
```

### Step 3: Run Automated Setup

```bash
# One-time setup (creates and configures bucket)
npm run setup-s3

# Deploy the application
npm run deploy
```

That's it! Your cost estimator will be live at: `http://your-bucket-name.s3-website-region.amazonaws.com`

## What the Setup Script Does

The `npm run setup-s3` command automatically:

1. ✅ **Verifies Prerequisites**
   - Checks AWS CLI installation
   - Validates AWS credentials
   - Confirms environment variables

2. 🪣 **Creates S3 Bucket**
   - Creates bucket with your chosen name
   - Sets appropriate region
   - Handles region-specific creation requirements

3. 🌐 **Configures Public Access**
   - Disables "Block Public Access" settings
   - Required for static website hosting

4. 🔒 **Sets Bucket Policy**
   - Allows public read access to website files
   - Restricts access to read-only

5. 🌍 **Enables Website Hosting**
   - Configures S3 for static website serving
   - Sets index.html as default document
   - Configures error handling

## Manual Setup (If Needed)

If you prefer to set up manually or troubleshoot issues:

### 1. Create S3 Bucket
```bash
# For us-east-1
aws s3api create-bucket --bucket your-bucket-name --region us-east-1

# For other regions
aws s3api create-bucket --bucket your-bucket-name --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2
```

### 2. Disable Block Public Access
```bash
aws s3api put-public-access-block --bucket your-bucket-name \
  --public-access-block-configuration \
  BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

### 3. Create Bucket Policy
Create `bucket-policy.json`:
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
aws s3api put-bucket-policy --bucket your-bucket-name --policy file://bucket-policy.json
```

### 4. Enable Website Hosting
```bash
aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
```

## Deployment Workflow

### Development
```bash
export S3_BUCKET_NAME=cost-estimator-dev
npm run setup-s3  # One time only
npm run deploy     # Every time you want to update
```

### Production
```bash
export S3_BUCKET_NAME=cost-estimator-prod
npm run setup-s3  # One time only
npm run deploy     # Every time you want to update
```

## Troubleshooting

### Common Setup Issues

**1. Bucket name already exists globally**
```
❌ A bucket with this name already exists
```
*Solution:* Choose a more unique bucket name (they're globally unique across all AWS accounts).

**2. AWS credentials not configured**
```
❌ AWS credentials not configured
```
*Solution:* Run `aws configure` and enter your access keys.

**3. Insufficient permissions**
```
❌ Access Denied when creating bucket
```
*Solution:* Ensure your AWS user has the S3 permissions listed above.

**4. Region issues**
```
❌ Bucket exists in different region
```
*Solution:* Set the correct `AWS_REGION` environment variable.

### Common Deployment Issues

**1. Build failures**
```
❌ Build failed
```
*Solution:* Run `npm install` and check for missing dependencies.

**2. Upload failures**
```
❌ S3 sync failed
```
*Solution:* Check AWS credentials and bucket permissions.

**3. Website not accessible**
```
❌ 403 Forbidden or 404 Not Found
```
*Solution:* Verify bucket policy and website hosting configuration.

### Debug Commands

```bash
# Test AWS credentials
aws sts get-caller-identity

# Check if bucket exists
aws s3api head-bucket --bucket your-bucket-name

# List bucket contents
aws s3 ls s3://your-bucket-name

# Check website configuration
aws s3api get-bucket-website --bucket your-bucket-name

# Test website URL
curl -I http://your-bucket-name.s3-website-us-east-1.amazonaws.com
```

## Security Notes

### What's Public
- All files in the bucket are publicly readable (required for websites)
- Configuration files are accessible to anyone with the URL
- No sensitive data should be stored in the bucket

### What's Protected
- Bucket creation/modification requires AWS credentials
- Only read access is granted to the public
- Write access requires proper AWS authentication

### Best Practices
- Use separate buckets for dev/staging/production
- Don't include sensitive pricing data in public configs
- Regularly review bucket contents
- Monitor AWS costs and usage

## Cost Considerations

### S3 Storage Costs
- **Standard storage**: ~$0.023 per GB/month
- **Website hosting**: No additional cost
- **Requests**: Minimal cost for typical usage

### Data Transfer Costs
- **First 1GB/month**: Free
- **Additional transfer**: ~$0.09 per GB
- Consider CloudFront for high-traffic sites

### Typical Monthly Costs
- **Small site** (< 100MB, < 1000 visitors): $0.10 - $1.00
- **Medium site** (< 1GB, < 10K visitors): $1.00 - $10.00
- **Large site** (> 1GB, > 100K visitors): $10.00+

## Next Steps

After successful deployment:

1. **Test the website** at your S3 URL
2. **Update configuration** files in `config/` directory
3. **Redeploy** with `npm run deploy` after changes
4. **Set up monitoring** in AWS CloudWatch
5. **Consider custom domain** for production use

Your cost estimator is now live and ready for use!