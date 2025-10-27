/**
 * Configuration Manager
 * Handles loading and validation of cost configuration files
 */

export class ConfigManager {
  constructor() {
    this.config = {
      baseCosts: {},
      formulas: {},
      multipliers: {}
    };
    this.isLoaded = false;
  }

  /**
   * Load configuration from files
   */
  async loadConfig() {
    try {
      const [baseCosts, formulas, multipliers] = await Promise.all([
        this.loadYamlFile('/config/base-costs.yaml'),
        this.loadYamlFile('/config/formulas.yaml'),
        this.loadYamlFile('/config/multipliers.yaml')
      ]);

      this.config.baseCosts = baseCosts;
      this.config.formulas = formulas;
      this.config.multipliers = multipliers;

      // Base costs are already flat, no need to flatten
      this.config.flatBaseCosts = baseCosts;
      
      this.isLoaded = true;
      return this.config;
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error;
    }
  }

  /**
   * Load a YAML file
   */
  async loadYamlFile(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.statusText}`);
      }
      const text = await response.text();
      return jsyaml.load(text);
    } catch (error) {
      console.error(`Error loading YAML file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Flatten nested base costs for easier variable access
   */
  flattenBaseCosts() {
    const flattened = {};
    
    function flattenObject(obj, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flattenObject(value, newKey);
        } else {
          flattened[newKey] = value;
        }
      }
    }
    
    flattenObject(this.config.baseCosts);
    this.config.flatBaseCosts = flattened;
  }

  /**
   * Get configuration
   */
  getConfig() {
    if (!this.isLoaded) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Get base costs
   */
  getBaseCosts() {
    return this.config.flatBaseCosts || {};
  }

  /**
   * Get formulas
   */
  getFormulas() {
    return this.config.formulas || {};
  }

  /**
   * Get multipliers
   */
  getMultipliers() {
    return this.config.multipliers || {};
  }

  /**
   * Update configuration (for runtime modifications)
   */
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    if (updates.baseCosts) {
      this.flattenBaseCosts();
    }
  }

  /**
   * Validate configuration structure
   */
  validateConfig() {
    const errors = [];

    // Check required sections
    if (!this.config.baseCosts) errors.push('Missing baseCosts section');
    if (!this.config.formulas) errors.push('Missing formulas section');
    if (!this.config.multipliers) errors.push('Missing multipliers section');

    // Check required services in formulas
    const requiredServices = ['transport', 'storage', 'extraction', 'enrichment', 'modeling', 'search', 'exploration'];
    for (const service of requiredServices) {
      if (!this.config.formulas[service]) {
        errors.push(`Missing formula for service: ${service}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Get default variable values for a service
   */
  getDefaultVariables(serviceType) {
    const defaults = {
      transport: {
        data_volume_gb: 100,
        egress_volume_gb: 50,
        priority_level: 1,
        encryption_level: 1
      },
      storage: {
        storage_volume_gb: 1000
      },
      extraction: {
        processing_hours: 10,
        extraction_complexity: 1
      },
      enrichment: {
        record_count: 10000,
        data_quality_score: 3,
        schema_complexity: 2
      },
      modeling: {
        model_type: 'simple',
        training_hours: 5,
        inference_requests: 1000
      },
      search: {
        search_queries: 10000,
        search_index_gb: 100,
        search_complexity: 1,
        real_time_requirements: 1
      },
      exploration: {
        analytics_type: 'basic',
        analysis_hours: 20
      }
    };

    return defaults[serviceType] || {};
  }

  /**
   * Export configuration for backup or sharing
   */
  exportConfig() {
    return {
      baseCosts: this.config.baseCosts,
      formulas: this.config.formulas,
      multipliers: this.config.multipliers,
      timestamp: new Date().toISOString()
    };
  }
}