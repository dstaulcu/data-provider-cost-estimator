/**
 * Main Application Controller
 * Coordinates the cost estimation interface
 */

import { CostCalculationEngine } from './cost-engine.js';
import { ConfigManager } from './config-manager.js';
import { UIController } from './ui-controller.js';

const API_GATEWAY_URL = 'https://tlo03uxhod.execute-api.us-east-1.amazonaws.com/prod/auth';

async function authenticateUser() {
    try {
        const response = await fetch(API_GATEWAY_URL, {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) {
            // Show error modal or restrict access
            throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
        }
        const userData = await response.json();
        // TODO: Use userData to update UI or store token
        return userData;
    } catch (error) {
        // Show error modal or restrict access
        console.error('Authentication error:', error);
        // Optionally, display error to user
        if (typeof showError === 'function') {
            showError('Authentication failed: ' + error.message);
        }
    }
}

class CostEstimatorApp {
  constructor() {
    this.configManager = new ConfigManager();
    this.costEngine = null;
    this.uiController = null;
    this.currentService = 'transport';
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Show loading overlay
      this.showLoading(true);

      console.log('Authenticating userr...');
      authenticateUser();      

      // Load configuration
      console.log('Loading configuration...');
      const config = await this.configManager.loadConfig();
      
      // Validate configuration
      this.configManager.validateConfig();

      // Initialize cost engine
      this.costEngine = new CostCalculationEngine(config);
      
      // Initialize UI controller
      this.uiController = new UIController(this.costEngine, this.configManager);
      await this.uiController.init();

      // Set up event listeners
      this.setupEventListeners();

      // Load default variables
      this.loadDefaultVariables();

      // Initial calculation
      this.calculateCosts();

      this.isInitialized = true;
      console.log('Application initialized successfully');

    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError('Failed to load application: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Service tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchService(e.target.dataset.service);
      });
    });

    // Calculate button
    document.getElementById('calculate-btn').addEventListener('click', () => {
      console.log('Calculate button clicked');
      this.calculateCosts();
    });

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', () => {
      this.resetToDefaults();
    });

    // Export button
    document.getElementById('export-btn').addEventListener('click', () => {
      this.exportConfiguration();
    });

    // Advanced settings toggle
    document.getElementById('advanced-toggle').addEventListener('click', () => {
      this.toggleAdvancedSettings();
    });

    // Variable input changes
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('variable-input')) {
        this.handleVariableChange(e);
      }
    });

    // Advanced multiplier changes
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('multiplier-select')) {
        this.handleMultiplierChange(e);
      }
    });

    // Modal close
    document.querySelector('.close').addEventListener('click', () => {
      this.hideError();
    });

    // Close modal on outside click
    document.getElementById('error-modal').addEventListener('click', (e) => {
      if (e.target.id === 'error-modal') {
        this.hideError();
      }
    });

    // Real-time calculation on input changes
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('variable-input') || 
          e.target.classList.contains('multiplier-select')) {
        // Debounce the calculation
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
          this.calculateCosts();
        }, 300);
      }
    });
  }

  /**
   * Switch to a different service tab
   */
  switchService(serviceType) {
    if (this.currentService === serviceType) return;

    // Update tab appearance
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-service="${serviceType}"]`).classList.add('active');

    // Update current service
    this.currentService = serviceType;

    // Update UI controls
    this.uiController.updateServiceControls(serviceType);
  }

  /**
   * Handle variable input changes
   */
  handleVariableChange(event) {
    const variableName = event.target.dataset.variable;
    const value = parseFloat(event.target.value) || 0;
    
    // Update cost engine
    this.costEngine.setVariable(variableName, value);

    // Update range display if it's a range input
    if (event.target.type === 'range') {
      const valueDisplay = event.target.parentNode.querySelector('.range-value');
      if (valueDisplay) {
        valueDisplay.textContent = this.formatValue(variableName, value);
      }
    }
  }

  /**
   * Handle multiplier changes
   */
  handleMultiplierChange(event) {
    const multiplierType = event.target.id;
    const value = event.target.value;
    
    // Apply multiplier logic based on type
    this.applyGlobalMultiplier(multiplierType, value);
  }

  /**
   * Apply global multipliers
   */
  applyGlobalMultiplier(type, value) {
    const multipliers = this.configManager.getMultipliers();
    
    switch (type) {
      case 'volume-tier':
        const volumeMultiplier = multipliers.volume_multipliers[value]?.multiplier || 1;
        this.costEngine.setVariable('volume_multiplier', volumeMultiplier);
        break;
      case 'contract-type':
        const contractMultiplier = multipliers.contract_multipliers[value] || 1;
        this.costEngine.setVariable('contract_multiplier', contractMultiplier);
        break;
      case 'support-level':
        const supportMultiplier = multipliers.support_multipliers[value] || 1;
        this.costEngine.setVariable('support_multiplier', supportMultiplier);
        break;
      case 'sla-level':
        const slaMultiplier = multipliers.sla_multipliers[value] || 1;
        this.costEngine.setVariable('sla_multiplier', slaMultiplier);
        break;
    }
  }

  /**
   * Calculate costs for all services
   */
  calculateCosts() {
    if (!this.isInitialized) {
      console.log('App not initialized yet');
      return;
    }

    try {
      console.log('Starting cost calculation...');
      
      // Get current variable values from UI
      this.syncVariablesFromUI();

      // Calculate costs
      const results = this.costEngine.calculateTotalCost();

      // Update UI with results
      this.uiController.updateResults(results);

      console.log('Cost calculation completed:', results);

    } catch (error) {
      console.error('Error calculating costs:', error);
      this.showError('Error calculating costs: ' + error.message);
    }
  }

  /**
   * Sync variables from UI inputs to cost engine
   */
  syncVariablesFromUI() {
    // Get base costs and set them as variables
    const baseCosts = this.configManager.getBaseCosts();
    for (const [key, value] of Object.entries(baseCosts)) {
      this.costEngine.setVariable(key, value);
    }

    // Get current input values
    document.querySelectorAll('.variable-input').forEach(input => {
      const variableName = input.dataset.variable;
      const value = parseFloat(input.value) || 0;
      this.costEngine.setVariable(variableName, value);
    });

    // Apply global multipliers
    document.querySelectorAll('.multiplier-select').forEach(select => {
      this.applyGlobalMultiplier(select.id, select.value);
    });
  }

  /**
   * Load default variables for all services
   */
  loadDefaultVariables() {
    const services = ['transport', 'storage', 'extraction', 'enrichment', 'modeling', 'search', 'exploration'];
    
    services.forEach(service => {
      const defaults = this.configManager.getDefaultVariables(service);
      for (const [key, value] of Object.entries(defaults)) {
        this.costEngine.setVariable(key, value);
      }
    });

    // Load base costs as variables
    const baseCosts = this.configManager.getBaseCosts();
    for (const [key, value] of Object.entries(baseCosts)) {
      this.costEngine.setVariable(key, value);
    }

    // Update UI with default values
    this.uiController.updateServiceControls(this.currentService);
  }

  /**
   * Reset to default values
   */
  resetToDefaults() {
    this.loadDefaultVariables();
    this.uiController.resetToDefaults();
    this.calculateCosts();
  }

  /**
   * Export current configuration
   */
  exportConfiguration() {
    try {
      const config = this.configManager.exportConfig();
      const state = this.costEngine.exportState();
      
      const exportData = {
        configuration: config,
        currentState: state,
        timestamp: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-estimator-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting configuration:', error);
      this.showError('Error exporting configuration: ' + error.message);
    }
  }

  /**
   * Toggle advanced settings panel
   */
  toggleAdvancedSettings() {
    const panel = document.getElementById('advanced-panel');
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';
    
    const button = document.getElementById('advanced-toggle');
    button.textContent = isVisible ? 'Advanced Settings' : 'Hide Advanced Settings';
  }

  /**
   * Format value for display
   */
  formatValue(variableName, value) {
    if (variableName.includes('cost') || variableName.includes('price')) {
      return `$${value.toFixed(2)}`;
    }
    if (variableName.includes('gb') || variableName.includes('volume')) {
      return `${value.toLocaleString()} GB`;
    }
    if (variableName.includes('hours')) {
      return `${value} hrs`;
    }
    if (variableName.includes('count') || variableName.includes('requests') || variableName.includes('queries')) {
      return value.toLocaleString();
    }
    return value.toString();
  }

  /**
   * Show/hide loading overlay
   */
  showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = show ? 'flex' : 'none';
  }

  /**
   * Show error modal
   */
  showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').style.display = 'flex';
  }

  /**
   * Hide error modal
   */
  hideError() {
    document.getElementById('error-modal').style.display = 'none';
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new CostEstimatorApp();
  app.init();
});