/**
 * Main Application Controller
 * Coordinates the cost estimation interface
 */

import { CostCalculationEngine } from './cost-engine.js';
import { ConfigManager } from './config-manager.js';
import { UIController } from './ui-controller.js';
import { ConsoleLogger } from './logger.js';

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
    this.logger = null;
    this.currentService = 'transport';
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize logger first
      this.logger = new ConsoleLogger();
      this.logger.init();
      
      console.log('=== Cost Estimator Application Starting ===');
      
      // Show loading overlay
      this.showLoading(true);

      console.log('Authenticating user...');
      // authenticateUser();      

      // Load configuration
      console.log('Loading configuration...');
      const config = await this.configManager.loadConfig();
      console.log('Configuration loaded successfully');
      
      // Validate configuration
      this.configManager.validateConfig();
      console.log('Configuration validated');

      // Initialize cost engine
      this.costEngine = new CostCalculationEngine(config);
      console.log('Cost engine initialized');
      
      // Initialize UI controller
      this.uiController = new UIController(this.costEngine, this.configManager);
      await this.uiController.init();
      console.log('UI controller initialized');

      // Set up event listeners
      this.setupEventListeners();
      console.log('Event listeners configured');

      // Load default variables
      this.loadDefaultVariables();
      console.log('Default variables loaded');

      // Initial calculation
      this.calculateCosts();

      this.isInitialized = true;
      console.log('=== Application initialized successfully ===');

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

    // Resources panel toggle
    document.getElementById('resources-toggle').addEventListener('click', () => {
      this.toggleResourcesPanel();
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
      console.log('--- Starting cost calculation ---');
      
      // Get current variable values from UI
      this.syncVariablesFromUI();

      // Get selected systems
      const selectedSystems = this.uiController.getSelectedSystems();
      console.log(`Selected systems: [${selectedSystems.join(', ')}]`);
      
      if (selectedSystems.length === 0) {
        console.warn('No systems selected');
        this.showError('Please select at least one system');
        return;
      }

      if (selectedSystems.length === 1) {
        // Single system calculation
        console.log(`Calculating costs for single system: ${selectedSystems[0]}`);
        const systemInfo = this.configManager.getSystemInfo(selectedSystems[0]);
        console.log(`System: ${systemInfo.name}`);
        
        const systemCosts = this.configManager.getSystemCosts(selectedSystems[0]);
        this.costEngine.setSystemCosts(selectedSystems[0], systemCosts);
        const results = this.costEngine.calculateTotalCost();
        
        console.log(`Total cost: $${results.total.toFixed(2)}`);
        console.log('Service breakdown:', results.breakdown.map(b => 
          `${b.service}: $${b.cost.toFixed(2)} (${b.percentage.toFixed(1)}%)`
        ).join(', '));
        
        // Update UI with results
        this.uiController.updateResults(results);
        console.log('✓ Single system calculation completed');
      } else {
        // Multi-system calculation
        console.log(`Calculating costs for ${selectedSystems.length} systems`);
        const systemResults = this.costEngine.calculateMultiSystemCosts(selectedSystems);
        
        systemResults.forEach((result, index) => {
          const systemInfo = this.configManager.getSystemInfo(result.systemId);
          console.log(`System ${index + 1}: ${systemInfo.name} - Total: $${result.total.toFixed(2)}`);
        });
        
        // Calculate combined results across all systems
        const combinedResults = this.combineSystemResults(systemResults);
        
        // Display combined results in the main view
        this.uiController.updateResults(combinedResults);
        
        // Update comparison chart
        this.uiController.updateComparisonChart(systemResults);
        
        console.log('✓ Multi-system calculation completed');
      }
      
      console.log('--- Cost calculation finished ---');

    } catch (error) {
      console.error('Error calculating costs:', error);
      this.showError('Error calculating costs: ' + error.message);
    }
  }

  /**
   * Sync variables from UI inputs to cost engine
   */
  syncVariablesFromUI() {
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
   * Combine results from multiple systems into a single summary
   */
  combineSystemResults(systemResults) {
    const combinedServices = {};
    let combinedTotal = 0;
    const allSupportedServices = new Set();
    const allUnsupportedServices = new Set();
    
    // Aggregate costs across all systems
    systemResults.forEach(result => {
      combinedTotal += result.total;
      
      // Track supported/unsupported services
      result.supportedServices?.forEach(s => allSupportedServices.add(s));
      result.unsupportedServices?.forEach(s => allUnsupportedServices.add(s));
      
      // Sum up costs for each service
      Object.entries(result.services || {}).forEach(([service, cost]) => {
        if (cost !== null && !isNaN(cost)) {
          combinedServices[service] = (combinedServices[service] || 0) + cost;
        }
      });
    });
    
    // Generate breakdown
    const breakdown = Object.entries(combinedServices)
      .filter(([_, cost]) => cost > 0)
      .map(([service, cost]) => ({
        service,
        cost,
        percentage: (cost / combinedTotal) * 100
      }))
      .sort((a, b) => b.cost - a.cost);
    
    // Only show unsupported if ALL systems don't support it
    const unsupportedServices = Array.from(allUnsupportedServices).filter(service => 
      !allSupportedServices.has(service)
    );
    
    return {
      services: combinedServices,
      total: combinedTotal,
      breakdown,
      supportedServices: Array.from(allSupportedServices),
      unsupportedServices,
      isMultiSystem: true,
      systemCount: systemResults.length
    };
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

    // Load base costs as variables from first system (for backward compatibility)
    const systems = this.configManager.getSystems();
    const firstSystemId = Object.keys(systems)[0];
    if (firstSystemId) {
      const systemCosts = this.configManager.getSystemCosts(firstSystemId);
      this.costEngine.setSystemCosts(firstSystemId, systemCosts);
    }

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
      
      // Get selected systems
      const selectedSystems = this.uiController?.getSelectedSystems() || [];
      const systemInfo = selectedSystems.map(systemId => {
        const info = this.configManager.getSystemInfo(systemId);
        return {
          id: systemId,
          ...(info || {})
        };
      });
      
      // Get all service parameters
      const serviceParameters = {};
      const formulas = this.costEngine?.formulas || {};
      for (const serviceType of Object.keys(formulas)) {
        try {
          const vars = this.uiController.getServiceVariables(serviceType);
          const params = {};
          if (vars) {
            for (const varName of Object.keys(vars)) {
              params[varName] = this.costEngine.getVariable(varName);
            }
          }
          serviceParameters[serviceType] = params;
        } catch (error) {
          console.warn(`Could not get parameters for ${serviceType}:`, error);
          serviceParameters[serviceType] = {};
        }
      }
      
      // Get global multipliers
      const multipliers = {
        volumeTier: document.getElementById('volume-tier')?.value || 'not set',
        contractType: document.getElementById('contract-type')?.value || 'not set',
        supportLevel: document.getElementById('support-level')?.value || 'not set',
        slaLevel: document.getElementById('sla-level')?.value || 'not set'
      };
      
      // Calculate current costs for export
      let calculatedResults = null;
      try {
        if (selectedSystems.length === 1) {
          calculatedResults = this.costEngine.calculateTotalCost();
        } else if (selectedSystems.length > 1) {
          calculatedResults = this.costEngine.calculateMultiSystemCosts(selectedSystems);
        }
      } catch (error) {
        console.warn('Could not calculate results for export:', error);
        calculatedResults = { error: 'Calculation failed: ' + error.message };
      }
      
      const exportData = {
        metadata: {
          timestamp: new Date().toISOString(),
          dateFormatted: new Date().toLocaleString(),
          applicationVersion: '1.0.0',
          exportType: 'cost-estimation-snapshot'
        },
        selectedSystems: systemInfo,
        serviceParameters,
        globalMultipliers: multipliers,
        calculatedResults,
        configuration: config,
        currentState: state
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
      
      console.log('Configuration exported successfully');

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
   * Toggle resources panel
   */
  toggleResourcesPanel() {
    const panel = document.getElementById('resources-panel');
    const isVisible = panel.style.display !== 'none';
    const newDisplay = isVisible ? 'none' : 'block';
    panel.style.display = newDisplay;
    
    const button = document.getElementById('resources-toggle');
    const newText = isVisible ? '📚 View Configuration Resources' : '📚 Hide Configuration Resources';
    button.textContent = newText;
    
    console.log(`Resources panel toggled: ${newDisplay} (was ${isVisible ? 'visible' : 'hidden'})`);
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