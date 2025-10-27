#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Validates YAML configuration files for syntax and structure
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Ajv from 'ajv';

const ajv = new Ajv();

// JSON Schema for base costs
const baseCostsSchema = {
  type: 'object',
  properties: {
    transport: { type: 'object' },
    storage: { type: 'object' },
    extraction: { type: 'object' },
    enrichment: { type: 'object' },
    modeling: { type: 'object' },
    search: { type: 'object' },
    exploration: { type: 'object' }
  },
  required: ['transport', 'storage', 'extraction', 'enrichment', 'modeling', 'search', 'exploration']
};

// JSON Schema for formulas
const formulasSchema = {
  type: 'object',
  properties: {
    transport: { type: 'object' },
    storage: { type: 'object' },
    extraction: { type: 'object' },
    enrichment: { type: 'object' },
    modeling: { type: 'object' },
    search: { type: 'object' },
    exploration: { type: 'object' }
  },
  required: ['transport', 'storage', 'extraction', 'enrichment', 'modeling', 'search', 'exploration']
};

// JSON Schema for multipliers
const multipliersSchema = {
  type: 'object',
  properties: {
    volume_multipliers: { type: 'object' },
    complexity_multipliers: { type: 'object' },
    contract_multipliers: { type: 'object' },
    support_multipliers: { type: 'object' },
    sla_multipliers: { type: 'object' }
  },
  required: ['volume_multipliers', 'complexity_multipliers', 'contract_multipliers', 'support_multipliers', 'sla_multipliers']
};

const schemas = {
  'base-costs.yaml': baseCostsSchema,
  'formulas.yaml': formulasSchema,
  'multipliers.yaml': multipliersSchema
};

async function validateConfigurations() {
  console.log('🔍 Validating configuration files...\n');

  const configDir = path.join(process.cwd(), 'config');
  let hasErrors = false;

  for (const [filename, schema] of Object.entries(schemas)) {
    const filePath = path.join(configDir, filename);
    
    try {
      console.log(`📄 Validating ${filename}...`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filename}`);
        hasErrors = true;
        continue;
      }

      // Read and parse YAML
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(fileContent);

      // Validate against schema
      const validate = ajv.compile(schema);
      const valid = validate(data);

      if (!valid) {
        console.error(`❌ Schema validation failed for ${filename}:`);
        validate.errors.forEach(error => {
          console.error(`   - ${error.instancePath}: ${error.message}`);
        });
        hasErrors = true;
      } else {
        console.log(`✅ ${filename} is valid`);
      }

      // Additional custom validations
      if (filename === 'base-costs.yaml') {
        validateBaseCosts(data, filename);
      } else if (filename === 'formulas.yaml') {
        validateFormulas(data, filename);
      }

    } catch (error) {
      console.error(`❌ Error validating ${filename}:`, error.message);
      hasErrors = true;
    }

    console.log('');
  }

  if (hasErrors) {
    console.error('❌ Configuration validation failed!');
    process.exit(1);
  } else {
    console.log('✅ All configuration files are valid!');
  }
}

function validateBaseCosts(data, filename) {
  // Check that all cost values are numbers
  function checkCostValues(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        checkCostValues(value, currentPath);
      } else if (key.includes('cost') || key.includes('rate') || key.includes('price')) {
        if (typeof value !== 'number' || value < 0) {
          console.warn(`⚠️  ${filename}: ${currentPath} should be a positive number, got ${typeof value}: ${value}`);
        }
      }
    }
  }

  checkCostValues(data);
}

function validateFormulas(data, filename) {
  // Check that formulas have required structure
  for (const [service, formula] of Object.entries(data)) {
    if (typeof formula === 'object' && formula.type) {
      switch (formula.type) {
        case 'tiered':
          if (!formula.volumeVar || !formula.tiers) {
            console.warn(`⚠️  ${filename}: Tiered formula for ${service} missing volumeVar or tiers`);
          }
          break;
        case 'multiplier':
          if (!formula.base) {
            console.warn(`⚠️  ${filename}: Multiplier formula for ${service} missing base`);
          }
          break;
        case 'conditional':
          if (!formula.conditions) {
            console.warn(`⚠️  ${filename}: Conditional formula for ${service} missing conditions`);
          }
          break;
      }
    }
  }
}

// Run validation
validateConfigurations().catch(error => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});