# Cost Estimator Examples

This document provides practical examples of how to use and customize the Cost Estimator.

## Basic Usage Examples

### Example 1: Small Business Data Pipeline

**Scenario**: A small business needs to process 500GB of customer data monthly with basic analytics.

**Configuration**:
```yaml
# Input Parameters
data_volume_gb: 500
storage_volume_gb: 1000
processing_hours: 20
record_count: 50000
analytics_type: "basic"
analysis_hours: 40
```

**Expected Monthly Cost**: ~$450

**Services Breakdown**:
- Transport: $60 (data ingestion + bandwidth)
- Storage: $25 (warm storage)
- Extraction: $300 (20 hours basic processing)
- Enrichment: $125 (50k records processing)
- Search: $15 (basic search on 100GB index)
- Exploration: $75 (40 hours basic analytics)

### Example 2: Enterprise ML Platform

**Scenario**: Large enterprise with complex ML workflows and real-time analytics.

**Configuration**:
```yaml
# Input Parameters
data_volume_gb: 50000
storage_volume_gb: 100000
processing_hours: 200
extraction_complexity: 3  # ML-based
model_type: "deep_learning"
training_hours: 100
analytics_type: "real_time"
search_complexity: 3  # Vector search
```

**Expected Monthly Cost**: ~$85,000

**Services Breakdown**:
- Transport: $2,500 (high-volume data movement)
- Storage: $8,500 (large-scale storage with tiers)
- Extraction: $24,000 (200 hours ML extraction)
- Enrichment: $15,000 (complex data processing)
- Modeling: $20,000 (deep learning training)
- Search: $12,000 (vector search capabilities)
- Exploration: $3,000 (real-time analytics)

### Example 3: Research Institution

**Scenario**: Academic research with irregular usage patterns and budget constraints.

**Configuration**:
```yaml
# Input Parameters
contract_type: "annual_commitment"  # 15% discount
support_level: "community"  # No additional cost
data_volume_gb: 5000
extraction_complexity: 2  # Advanced but not ML
model_type: "complex"
analytics_type: "advanced"
```

**Expected Monthly Cost**: ~$8,500 (with annual commitment discount)

## Configuration Customization Examples

### Custom Pricing for New Service Tier

Add a new "premium" tier with enhanced SLAs:

```yaml
# In base-costs.yaml
premium_services:
  premium_extraction_per_hour: 200.00
  premium_sla_multiplier: 2.0
  premium_support_included: true

# In formulas.yaml
extraction:
  type: "conditional"
  conditions:
    - if: { variable: "service_tier", operator: "==", value: "premium" }
      then: "$processing_hours * $premium_extraction_per_hour"
    - if: { variable: "extraction_complexity", operator: ">=", value: 3 }
      then: "$processing_hours * $ml_extraction_per_hour"
  else: "$processing_hours * $basic_extraction_per_hour"
```

### Volume Discount Implementation

```yaml
# In formulas.yaml
storage:
  type: "tiered"
  volumeVar: "storage_volume_gb"
  tiers:
    - limit: 1000      # First 1TB
      rate: 0.025
    - limit: 10000     # Next 9TB
      rate: 0.020      # 20% discount
    - limit: 100000    # Next 90TB
      rate: 0.015      # 40% discount
    - limit: null      # Beyond 100TB
      rate: 0.010      # 60% discount
```

### Geographic Pricing Variations

```yaml
# In multipliers.yaml
geographic_multipliers:
  us_east: 1.0      # Base pricing
  us_west: 1.1      # 10% premium
  europe: 1.15      # 15% premium
  asia_pacific: 1.2 # 20% premium

# In formulas.yaml
transport:
  type: "multiplier"
  base: "$data_volume_gb * $ingestion_cost_per_gb"
  multipliers:
    - variable: "region"
      factor: "$geographic_multiplier"
```

## Integration Examples

### REST API Integration

```javascript
// Example: Calculate costs programmatically
async function calculateCosts(parameters) {
  const response = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parameters)
  });
  
  return await response.json();
}

// Usage
const costs = await calculateCosts({
  data_volume_gb: 1000,
  storage_volume_gb: 2000,
  processing_hours: 50
});

console.log(`Total cost: $${costs.total}`);
```

### Webhook Integration

```javascript
// Example: Send cost estimates to external systems
function sendCostEstimate(estimate) {
  fetch('https://your-api.com/webhooks/cost-estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      estimate: estimate,
      breakdown: estimate.breakdown
    })
  });
}
```

### Slack Integration

```javascript
// Example: Post cost estimates to Slack
function postToSlack(estimate) {
  const message = {
    text: `💰 Cost Estimate: $${estimate.total.toFixed(2)}`,
    attachments: estimate.breakdown.map(service => ({
      color: service.cost > 1000 ? 'danger' : 'good',
      fields: [{
        title: service.service.toUpperCase(),
        value: `$${service.cost.toFixed(2)} (${service.percentage.toFixed(1)}%)`,
        short: true
      }]
    }))
  };

  fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify(message)
  });
}
```

## Testing Scenarios

### Load Testing Example

```javascript
// Test with various data volumes
const testCases = [
  { data_volume_gb: 100, expected_range: [40, 60] },
  { data_volume_gb: 1000, expected_range: [300, 500] },
  { data_volume_gb: 10000, expected_range: [2500, 4000] }
];

testCases.forEach(testCase => {
  const result = calculateCosts(testCase);
  const inRange = result.total >= testCase.expected_range[0] && 
                  result.total <= testCase.expected_range[1];
  
  console.log(`Volume ${testCase.data_volume_gb}GB: $${result.total} - ${inRange ? 'PASS' : 'FAIL'}`);
});
```

### Edge Case Testing

```javascript
// Test edge cases
const edgeCases = [
  { data_volume_gb: 0 },           // Zero volume
  { data_volume_gb: 1000000 },     // Very large volume
  { processing_hours: 0.1 },       // Fractional hours
  { record_count: 1 },             // Single record
];

edgeCases.forEach(testCase => {
  try {
    const result = calculateCosts(testCase);
    console.log(`Edge case passed: ${JSON.stringify(testCase)}`);
  } catch (error) {
    console.error(`Edge case failed: ${JSON.stringify(testCase)}, Error: ${error.message}`);
  }
});
```

## Deployment Examples

### Multi-Environment Setup

```bash
# Development
export S3_BUCKET_NAME=cost-estimator-dev
export DEPLOY_ENVIRONMENT=development
npm run deploy

# Staging  
export S3_BUCKET_NAME=cost-estimator-staging
export DEPLOY_ENVIRONMENT=staging
npm run deploy

# Production
export S3_BUCKET_NAME=cost-estimator-prod
export DEPLOY_ENVIRONMENT=production
npm run deploy
```

### CI/CD Pipeline Example (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Cost Estimator

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Validate configuration
        run: npm run validate-config
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          S3_BUCKET_NAME: ${{ secrets.S3_BUCKET_NAME }}
        run: npm run deploy
```

## Monitoring Examples

### Cost Tracking Dashboard

```javascript
// Example: Track estimation usage
class CostEstimatorAnalytics {
  constructor() {
    this.usage = [];
  }
  
  trackCalculation(parameters, result) {
    this.usage.push({
      timestamp: new Date(),
      parameters: parameters,
      result: result,
      sessionId: this.getSessionId()
    });
    
    // Send to analytics service
    this.sendAnalytics({
      event: 'cost_calculation',
      properties: {
        total_cost: result.total,
        service_count: Object.keys(result.services).length,
        largest_service: this.getLargestService(result.breakdown)
      }
    });
  }
  
  getLargestService(breakdown) {
    return breakdown.reduce((max, service) => 
      service.cost > max.cost ? service : max
    ).service;
  }
}
```

### Performance Monitoring

```javascript
// Example: Monitor calculation performance
function measureCalculationTime(parameters) {
  const startTime = performance.now();
  const result = calculateCosts(parameters);
  const endTime = performance.now();
  
  console.log(`Calculation took ${endTime - startTime} milliseconds`);
  
  // Alert if calculation takes too long
  if (endTime - startTime > 1000) {
    console.warn('Slow calculation detected');
  }
  
  return result;
}
```

These examples demonstrate the flexibility and extensibility of the Cost Estimator framework. You can adapt these patterns to your specific use cases and requirements.