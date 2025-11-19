# Configuration Management Guide

This guide explains how to manage and update cost variables and formulas for the Data Provider Cost Estimator.

## Overview

The cost estimation system uses three main configuration files:

- `config/base-costs.yaml` - Base pricing for all services
- `config/formulas.yaml` - Cost calculation formulas
- `config/multipliers.yaml` - Volume and complexity multipliers

All configuration files are version-controlled and can be updated through Git workflows.

## Configuration Files

### Base Costs (`base-costs.yaml`)

Contains the fundamental pricing units for each service type:

```yaml
transport:
  ingestion_cost_per_gb: 0.01
  egress_cost_per_gb: 0.02
  bandwidth_base_cost: 50.00

storage:
  hot_storage_per_gb_month: 0.025
  warm_storage_per_gb_month: 0.015
  # ... more costs
```

**Best Practices:**
- Use descriptive variable names
- Include units in variable names (e.g., `_per_gb`, `_per_hour`)
- Keep costs in USD for consistency
- Document complex pricing structures

### Formulas (`formulas.yaml`)

Defines how costs are calculated for each service:

```yaml
transport:
  type: "multiplier"
  base: "$data_volume_gb * $ingestion_cost_per_gb + $bandwidth_base_cost"
  multipliers:
    - variable: "priority_level"
      factor: 1.5
```

**Formula Types:**

1. **Simple Expression**: Basic mathematical formula
2. **Tiered**: Volume-based pricing tiers
3. **Multiplier**: Base cost with multipliers
4. **Conditional**: If-then logic based on variables

### Multipliers (`multipliers.yaml`)

Global multipliers applied based on service requirements:

```yaml
volume_multipliers:
  small:
    threshold: 100
    multiplier: 1.0
  large:
    threshold: 10000
    multiplier: 0.90
```

## Updating Configuration

### 1. Local Development

```bash
# Clone the repository
git clone <repository-url>
cd data-provider-cost-estimator

# Install dependencies
npm install

# Make configuration changes
# Edit files in config/ directory

# Validate changes
npm run validate-config

# Test locally
npm run dev
```

### 2. Formula Types and Examples

#### Simple Expression
```yaml
service_name: "$variable1 * $rate + $base_cost"
```

#### Tiered Pricing
```yaml
service_name:
  type: "tiered"
  volumeVar: "data_volume_gb"
  tiers:
    - limit: 1000
      rate: 0.025
    - limit: 10000
      rate: 0.020
    - limit: null  # unlimited
      rate: 0.015
```

#### Multiplier Formula
```yaml
service_name:
  type: "multiplier"
  base: "$base_calculation"
  multipliers:
    - variable: "complexity_level"
      factor: 1.5
    - variable: "priority_level"
      factor: 2.0
```

#### Conditional Formula
```yaml
service_name:
  type: "conditional"
  conditions:
    - if: { variable: "service_type", operator: "==", value: "premium" }
      then: "$hours * $premium_rate"
    - if: { variable: "volume_gb", operator: ">", value: 1000 }
      then: "$volume_gb * $bulk_rate"
  else: "$hours * $standard_rate"
```

### 3. Variable Naming Conventions

- Use lowercase with underscores: `data_volume_gb`
- Include units: `cost_per_hour`, `rate_per_gb`
- Be descriptive: `ml_extraction_per_hour` vs `rate1`
- Consistent prefixes: all costs start with cost/rate/price

### 4. Testing Changes

```bash
# Validate configuration syntax
npm run validate-config

# Test specific scenarios
npm run dev
# Use the web interface to test different values

# Run automated tests (if available)
npm test
```

## Version Control Workflow

### 1. Feature Branch Workflow

```bash
# Create feature branch
git checkout -b update-pricing-2025

# Make changes to configuration files
# ... edit config files ...

# Validate changes
npm run validate-config

# Commit changes
git add config/
git commit -m "Update pricing for 2025 rates"

# Push and create pull request
git push origin update-pricing-2025
```

### 2. Pull Request Review

Include in your PR description:
- Summary of pricing changes
- Business justification
- Impact analysis
- Testing performed

### 3. Deployment

```bash
# After PR approval and merge
git checkout main
git pull origin main

# Deploy to staging
export S3_BUCKET_NAME=cost-estimator-staging
npm run deploy

# Validate staging deployment
# Test all service calculations

# Deploy to production
export S3_BUCKET_NAME=cost-estimator-prod
npm run deploy
```

## Advanced Configuration

### 1. Environment-Specific Pricing

Create environment-specific configuration files:

```
config/
├── base-costs.yaml          # Default
├── base-costs.staging.yaml  # Staging overrides
└── base-costs.prod.yaml     # Production overrides
```

### 2. A/B Testing Formulas

Use conditional logic for testing:

```yaml
new_formula:
  type: "conditional"
  conditions:
    - if: { variable: "test_group", operator: "==", value: "A" }
      then: "$volume * $rate_a"
    - if: { variable: "test_group", operator: "==", value: "B" }
      then: "$volume * $rate_b * 0.95"
  else: "$volume * $rate_standard"
```

### 3. Complex Pricing Models

```yaml
enterprise_pricing:
  type: "conditional"
  conditions:
    - if: { variable: "contract_type", operator: "==", value: "enterprise" }
      then:
        type: "tiered"
        volumeVar: "monthly_volume"
        tiers:
          - limit: 10000
            rate: "$enterprise_tier1_rate"
          - limit: 50000
            rate: "$enterprise_tier2_rate"
          - limit: null
            rate: "$enterprise_tier3_rate"
  else: "$volume * $standard_rate"
```

## Validation and Quality Assurance

### 1. Automated Validation

The `validate-config.js` script checks:
- YAML syntax
- Required fields
- Data types
- Logical consistency

### 2. Manual Testing Checklist

- [ ] All services calculate correctly
- [ ] Edge cases (zero values, large numbers)
- [ ] Multipliers apply correctly
- [ ] UI displays values properly
- [ ] Export functionality works

### 3. Regression Testing

Keep test scenarios in documentation:

```yaml
# Test Scenarios
test_cases:
  basic_transport:
    data_volume_gb: 100
    expected_cost: 51.50
  
  large_storage:
    storage_volume_gb: 50000
    expected_cost: 1075.00
```

## Monitoring and Analytics

### 1. Usage Tracking

Consider adding analytics to track:
- Most used services
- Common variable ranges
- Error rates in calculations

### 2. Performance Monitoring

Monitor:
- Configuration load times
- Calculation performance
- Memory usage with large datasets

## Troubleshooting

### Common Issues

1. **YAML Syntax Errors**
   ```bash
   npm run validate-config
   # Check line numbers in error output
   ```

2. **Variable Not Found**
   - Check variable names match exactly
   - Verify variables are defined in base-costs.yaml

3. **Formula Errors**
   - Test formulas with simple values
   - Check parentheses and operators

4. **Multiplier Issues**
   - Verify multiplier variable exists
   - Check factor values are reasonable

### Debug Mode

Enable debug logging in the browser console:

```javascript
// In browser console
localStorage.setItem('cost-estimator:debug', 'true');
location.reload();
```

**Note**: This application uses namespaced localStorage keys with the prefix `cost-estimator:` to avoid collisions with other applications sharing the same domain. If you need to store user preferences or state, always use the `StorageManager` utility from `src/js/storage.js`:

```javascript
import { StorageManager } from './storage.js';

// Store user preference
StorageManager.setItem('theme', 'dark');

// Retrieve preference
const theme = StorageManager.getItem('theme');

// Remove preference
StorageManager.removeItem('theme');

// Clear all app-specific storage
StorageManager.clear();
```

## Best Practices

1. **Documentation**: Comment complex formulas
2. **Testing**: Always test after changes
3. **Versioning**: Use semantic versioning for major changes
4. **Backup**: Keep backups of working configurations
5. **Gradual Rollout**: Test in staging before production
6. **Monitoring**: Watch for calculation errors after updates

## Getting Help

1. Check this documentation
2. Review existing configuration examples
3. Use the validation script
4. Test in the development environment
5. Create an issue in the repository for complex problems