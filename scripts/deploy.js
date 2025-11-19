#!/usr/bin/env node

/**
 * AWS S3 Deployment Script
 * Deploys the built application to S3 with optimized settings
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REQUIRED_ENV_VARS = ['S3_BUCKET_NAME'];
const OPTIONAL_ENV_VARS = {
  AWS_REGION: 'us-east-1',
  DEPLOY_ENVIRONMENT: 'production',
  S3_PREFIX: ''
};

function checkEnvironment() {
  console.log('🔍 Checking environment variables...');

  const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these environment variables before deploying.');
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

function buildApplication() {
  console.log('\n🏗️  Building application...');
  
  try {
    // Set VITE_BASE_PATH for subdirectory deployment
    const s3Prefix = process.env.S3_PREFIX || '';
    const basePath = s3Prefix ? `/${s3Prefix}/` : '/';
    process.env.VITE_BASE_PATH = basePath;
    
    console.log(`Base path: ${basePath}`);
    execSync('npm run build', { stdio: 'inherit', env: process.env });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

function validateBuild() {
  console.log('\n🔍 Validating build output...');

  const distDir = path.join(process.cwd(), 'dist');
  const requiredFiles = ['index.html', 'config/base-costs.yaml', 'config/formulas.yaml', 'config/multipliers.yaml'];

  if (!fs.existsSync(distDir)) {
    console.error('❌ Build directory not found');
    process.exit(1);
  }

  const missing = requiredFiles.filter(file => !fs.existsSync(path.join(distDir, file)));
  
  if (missing.length > 0) {
    console.error('❌ Missing required files in build:');
    missing.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }

  console.log('✅ Build validation passed');
}

function deployToS3() {
  console.log('\n🚀 Deploying to S3...');

  const bucketName = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  const s3Prefix = process.env.S3_PREFIX || '';
  const s3Path = s3Prefix ? `s3://${bucketName}/${s3Prefix}/` : `s3://${bucketName}/`;

  try {
    // Sync all files with simple cache headers
    console.log('📁 Uploading files...');
    console.log(`Target: ${s3Path}`);
    
    // Upload all files with short cache for development flexibility
    execSync(`aws s3 sync dist/ ${s3Path} --delete --cache-control "max-age=300" --region ${region}`, { stdio: 'inherit' });

    // Set website configuration (only for root bucket deployment)
    if (!s3Prefix) {
      console.log('🌐 Configuring website settings...');
      execSync(`aws s3 website s3://${bucketName} --index-document index.html --error-document index.html --region ${region}`, { stdio: 'inherit' });
    } else {
      console.log('ℹ️  Skipping website configuration (subdirectory deployment)');
    }

    console.log('✅ S3 deployment completed');
    
    if (s3Prefix) {
      console.log(`🌍 Website URL: http://${bucketName}.s3-website-${region}.amazonaws.com/${s3Prefix}/`);
    } else {
      console.log(`🌍 Website URL: http://${bucketName}.s3-website-${region}.amazonaws.com`);
    }

  } catch (error) {
    console.error('❌ S3 deployment failed:', error.message);
    process.exit(1);
  }
}

function generateDeploymentSummary() {
  console.log('\n📋 Deployment Summary');
  console.log('='.repeat(50));
  console.log(`Environment: ${process.env.DEPLOY_ENVIRONMENT}`);
  console.log(`S3 Bucket: ${process.env.S3_BUCKET_NAME}`);
  console.log(`S3 Path: ${process.env.S3_PREFIX || '(root)'}`);
  console.log(`AWS Region: ${process.env.AWS_REGION}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  console.log('\n✅ Deployment completed successfully!');
}

// Main deployment process
async function deploy() {
  try {
    checkEnvironment();
    buildApplication();
    validateBuild();
    deployToS3();
    generateDeploymentSummary();
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📦 Cost Estimator Deployment Script

Usage: node scripts/deploy.js [options]

Required Environment Variables:
  S3_BUCKET_NAME              S3 bucket name for deployment

Optional Environment Variables:
  AWS_REGION                  AWS region (default: us-east-1)
  DEPLOY_ENVIRONMENT          Deployment environment (default: production)
  S3_PREFIX                   S3 path prefix for subdirectory deployment (e.g., cost-estimator/dev)

Examples:
  # Deploy to bucket root
  export S3_BUCKET_NAME=my-cost-estimator-bucket
  node scripts/deploy.js

  # Deploy to subdirectory
  export S3_BUCKET_NAME=293354421824-10xtools
  export S3_PREFIX=cost-estimator/dev
  node scripts/deploy.js

  # Deploy to different region
  export S3_BUCKET_NAME=my-bucket
  export AWS_REGION=us-west-2
  node scripts/deploy.js
`);
  process.exit(0);
}

// Run deployment
deploy();