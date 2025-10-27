#!/usr/bin/env node

/**
 * S3 Bucket Setup Script
 * Creates and configures S3 bucket for static website hosting
 */

import { execSync } from 'child_process';
import fs from 'fs';

const REQUIRED_ENV_VARS = ['S3_BUCKET_NAME'];
const OPTIONAL_ENV_VARS = {
  AWS_REGION: 'us-east-1'
};

function checkEnvironment() {
  console.log('🔍 Checking environment variables...');

  const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these environment variables before setup.');
    console.error('Example: export S3_BUCKET_NAME=your-bucket-name');
    process.exit(1);
  }

  // Set defaults for optional variables
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[varName] && defaultValue) {
      process.env[varName] = defaultValue;
    }
  }

  console.log('✅ Environment variables OK');
}

function checkAWSCLI() {
  console.log('\n🔍 Checking AWS CLI...');
  
  try {
    execSync('aws --version', { stdio: 'pipe' });
    console.log('✅ AWS CLI is installed');
  } catch (error) {
    console.error('❌ AWS CLI not found. Please install AWS CLI first:');
    console.error('   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html');
    process.exit(1);
  }

  try {
    execSync('aws sts get-caller-identity', { stdio: 'pipe' });
    console.log('✅ AWS credentials configured');
  } catch (error) {
    console.error('❌ AWS credentials not configured. Please run:');
    console.error('   aws configure');
    process.exit(1);
  }
}

function createBucket() {
  const bucketName = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  console.log(`\n🪣 Creating S3 bucket: ${bucketName}`);

  try {
    // Check if bucket already exists
    try {
      execSync(`aws s3api head-bucket --bucket ${bucketName} --region ${region}`, { stdio: 'pipe' });
      console.log('✅ Bucket already exists');
      return;
    } catch (error) {
      // Bucket doesn't exist, create it
    }

    // Create bucket
    if (region === 'us-east-1') {
      // us-east-1 doesn't need location constraint
      execSync(`aws s3api create-bucket --bucket ${bucketName} --region ${region}`, { stdio: 'inherit' });
    } else {
      execSync(`aws s3api create-bucket --bucket ${bucketName} --region ${region} --create-bucket-configuration LocationConstraint=${region}`, { stdio: 'inherit' });
    }

    console.log('✅ Bucket created successfully');

  } catch (error) {
    console.error('❌ Failed to create bucket:', error.message);
    process.exit(1);
  }
}

function configureBucketPolicy() {
  const bucketName = process.env.S3_BUCKET_NAME;

  console.log('\n🔒 Configuring bucket policy for public website access...');

  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${bucketName}/*`
      }
    ]
  };

  try {
    // Write policy to temporary file
    const policyFile = 'bucket-policy.json';
    fs.writeFileSync(policyFile, JSON.stringify(policy, null, 2));

    // Apply bucket policy
    execSync(`aws s3api put-bucket-policy --bucket ${bucketName} --policy file://${policyFile}`, { stdio: 'inherit' });

    // Clean up
    fs.unlinkSync(policyFile);

    console.log('✅ Bucket policy configured');

  } catch (error) {
    console.error('❌ Failed to configure bucket policy:', error.message);
    process.exit(1);
  }
}

function disableBlockPublicAccess() {
  const bucketName = process.env.S3_BUCKET_NAME;

  console.log('\n🌐 Disabling block public access for website hosting...');

  try {
    execSync(`aws s3api put-public-access-block --bucket ${bucketName} --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false`, { stdio: 'inherit' });

    console.log('✅ Public access configured');

  } catch (error) {
    console.error('❌ Failed to configure public access:', error.message);
    process.exit(1);
  }
}

function enableStaticWebsiteHosting() {
  const bucketName = process.env.S3_BUCKET_NAME;

  console.log('\n🌍 Enabling static website hosting...');

  try {
    execSync(`aws s3 website s3://${bucketName} --index-document index.html --error-document index.html`, { stdio: 'inherit' });

    console.log('✅ Static website hosting enabled');

  } catch (error) {
    console.error('❌ Failed to enable website hosting:', error.message);
    process.exit(1);
  }
}

function generateSummary() {
  const bucketName = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  console.log('\n📋 Setup Summary');
  console.log('='.repeat(50));
  console.log(`S3 Bucket: ${bucketName}`);
  console.log(`AWS Region: ${region}`);
  console.log(`Website URL: http://${bucketName}.s3-website-${region}.amazonaws.com`);
  console.log(`Setup completed: ${new Date().toISOString()}`);
  
  console.log('\n✅ S3 bucket setup completed successfully!');
  console.log('\n🚀 You can now run: npm run deploy');
}

// Main setup process
async function setupBucket() {
  try {
    checkEnvironment();
    checkAWSCLI();
    createBucket();
    disableBlockPublicAccess();
    configureBucketPolicy();
    enableStaticWebsiteHosting();
    generateSummary();
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🪣 S3 Bucket Setup Script

This script creates and configures an S3 bucket for static website hosting.

Usage: node scripts/setup-s3.js

Required Environment Variables:
  S3_BUCKET_NAME              S3 bucket name (must be globally unique)

Optional Environment Variables:
  AWS_REGION                  AWS region (default: us-east-1)

Prerequisites:
  - AWS CLI installed and configured
  - AWS credentials with S3 permissions

What this script does:
  1. Creates S3 bucket (if it doesn't exist)
  2. Disables block public access
  3. Sets bucket policy for public read access
  4. Enables static website hosting

Examples:
  export S3_BUCKET_NAME=my-cost-estimator-bucket
  node scripts/setup-s3.js

  export S3_BUCKET_NAME=my-unique-bucket-name
  export AWS_REGION=us-west-2
  node scripts/setup-s3.js
`);
  process.exit(0);
}

// Run setup
setupBucket();