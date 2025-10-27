/**
 * UI Controller
 * Manages the user interface components and interactions
 */

export class UIController {
  constructor(costEngine, configManager) {
    this.costEngine = costEngine;
    this.configManager = configManager;
    this.chart = null;
    this.currentService = 'transport';
  }

  /**
   * Initialize UI components
   */
  async init() {
    this.setupChart();
    this.updateConfigTimestamp();
  }

  /**
   * Update service controls based on selected service
   */
  updateServiceControls(serviceType) {
    this.currentService = serviceType;
    const controlsContainer = document.getElementById('variable-controls');
    controlsContainer.innerHTML = '';

    const variables = this.getServiceVariables(serviceType);
    const defaults = this.configManager.getDefaultVariables(serviceType);

    for (const [varName, config] of Object.entries(variables)) {
      const defaultValue = defaults[varName] || config.default || 0;
      const controlGroup = this.createVariableControl(varName, config, defaultValue);
      controlsContainer.appendChild(controlGroup);
    }
  }

  /**
   * Get variable definitions for a service
   */
  getServiceVariables(serviceType) {
    const serviceVariables = {
      transport: {
        data_volume_gb: { 
          type: 'range', 
          min: 1, 
          max: 10000, 
          step: 1, 
          default: 100,
          label: 'Data Volume (GB)',
          description: 'Amount of data to transport'
        },
        egress_volume_gb: { 
          type: 'range', 
          min: 0, 
          max: 5000, 
          step: 1, 
          default: 50,
          label: 'Egress Volume (GB)',
          description: 'Data transferred out'
        },
        priority_level: { 
          type: 'select', 
          options: [
            { value: 1, label: 'Standard' },
            { value: 2, label: 'Priority' },
            { value: 3, label: 'Urgent' }
          ],
          default: 1,
          label: 'Priority Level',
          description: 'Service priority level'
        },
        encryption_level: { 
          type: 'select', 
          options: [
            { value: 1, label: 'Basic' },
            { value: 2, label: 'Advanced' },
            { value: 3, label: 'Enterprise' }
          ],
          default: 1,
          label: 'Encryption Level',
          description: 'Data encryption requirements'
        }
      },
      storage: {
        storage_volume_gb: { 
          type: 'range', 
          min: 10, 
          max: 100000, 
          step: 10, 
          default: 1000,
          label: 'Storage Volume (GB)',
          description: 'Total storage capacity needed'
        }
      },
      extraction: {
        processing_hours: { 
          type: 'range', 
          min: 1, 
          max: 200, 
          step: 1, 
          default: 10,
          label: 'Processing Hours',
          description: 'Hours of processing time'
        },
        extraction_complexity: { 
          type: 'select', 
          options: [
            { value: 1, label: 'Basic' },
            { value: 2, label: 'Advanced' },
            { value: 3, label: 'ML-based' }
          ],
          default: 1,
          label: 'Extraction Complexity',
          description: 'Complexity of data extraction'
        }
      },
      enrichment: {
        record_count: { 
          type: 'range', 
          min: 1000, 
          max: 10000000, 
          step: 1000, 
          default: 10000,
          label: 'Record Count',
          description: 'Number of records to process'
        },
        data_quality_score: { 
          type: 'range', 
          min: 1, 
          max: 5, 
          step: 1, 
          default: 3,
          label: 'Data Quality Score',
          description: 'Current data quality (1=poor, 5=excellent)'
        },
        schema_complexity: { 
          type: 'select', 
          options: [
            { value: 1, label: 'Simple' },
            { value: 2, label: 'Moderate' },
            { value: 3, label: 'Complex' }
          ],
          default: 2,
          label: 'Schema Complexity',
          description: 'Data schema complexity level'
        }
      },
      modeling: {
        model_type: { 
          type: 'select', 
          options: [
            { value: 'simple', label: 'Simple Model' },
            { value: 'complex', label: 'Complex Model' },
            { value: 'deep_learning', label: 'Deep Learning' }
          ],
          default: 'simple',
          label: 'Model Type',
          description: 'Type of machine learning model'
        },
        training_hours: { 
          type: 'range', 
          min: 1, 
          max: 100, 
          step: 1, 
          default: 5,
          label: 'Training Hours',
          description: 'Model training time'
        },
        inference_requests: { 
          type: 'range', 
          min: 100, 
          max: 1000000, 
          step: 100, 
          default: 1000,
          label: 'Inference Requests',
          description: 'Monthly prediction requests'
        }
      },
      search: {
        search_queries: { 
          type: 'range', 
          min: 1000, 
          max: 10000000, 
          step: 1000, 
          default: 10000,
          label: 'Search Queries',
          description: 'Monthly search queries'
        },
        search_index_gb: { 
          type: 'range', 
          min: 10, 
          max: 10000, 
          step: 10, 
          default: 100,
          label: 'Search Index Size (GB)',
          description: 'Size of search index'
        },
        search_complexity: { 
          type: 'select', 
          options: [
            { value: 1, label: 'Basic Search' },
            { value: 2, label: 'Semantic Search' },
            { value: 3, label: 'Vector Search' }
          ],
          default: 1,
          label: 'Search Complexity',
          description: 'Type of search functionality'
        },
        real_time_requirements: { 
          type: 'select', 
          options: [
            { value: 1, label: 'Batch' },
            { value: 2, label: 'Near Real-time' },
            { value: 3, label: 'Real-time' }
          ],
          default: 1,
          label: 'Real-time Requirements',
          description: 'Response time requirements'
        }
      },
      exploration: {
        analytics_type: { 
          type: 'select', 
          options: [
            { value: 'basic', label: 'Basic Analytics' },
            { value: 'advanced', label: 'Advanced Analytics' },
            { value: 'real_time', label: 'Real-time Analytics' }
          ],
          default: 'basic',
          label: 'Analytics Type',
          description: 'Type of analytics required'
        },
        analysis_hours: { 
          type: 'range', 
          min: 5, 
          max: 200, 
          step: 5, 
          default: 20,
          label: 'Analysis Hours',
          description: 'Monthly analysis hours'
        }
      }
    };

    return serviceVariables[serviceType] || {};
  }

  /**
   * Create a variable control element
   */
  createVariableControl(varName, config, defaultValue) {
    const group = document.createElement('div');
    group.className = 'variable-group';

    const label = document.createElement('label');
    label.htmlFor = `var-${varName}`;
    label.textContent = config.label || varName;
    if (config.description) {
      label.title = config.description;
    }

    let input;
    if (config.type === 'range') {
      const rangeContainer = document.createElement('div');
      rangeContainer.className = 'range-input';

      input = document.createElement('input');
      input.type = 'range';
      input.id = `var-${varName}`;
      input.className = 'variable-input';
      input.dataset.variable = varName;
      input.min = config.min || 0;
      input.max = config.max || 100;
      input.step = config.step || 1;
      input.value = defaultValue;

      const valueDisplay = document.createElement('div');
      valueDisplay.className = 'range-value';
      valueDisplay.textContent = this.formatValue(varName, defaultValue);

      rangeContainer.appendChild(input);
      rangeContainer.appendChild(valueDisplay);

      // Update display when range changes
      input.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        valueDisplay.textContent = this.formatValue(varName, value);
      });

      group.appendChild(label);
      group.appendChild(rangeContainer);
    } else if (config.type === 'select') {
      input = document.createElement('select');
      input.id = `var-${varName}`;
      input.className = 'variable-input';
      input.dataset.variable = varName;

      config.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        if (option.value === defaultValue) {
          optionElement.selected = true;
        }
        input.appendChild(optionElement);
      });

      group.appendChild(label);
      group.appendChild(input);
    } else {
      input = document.createElement('input');
      input.type = 'number';
      input.id = `var-${varName}`;
      input.className = 'variable-input';
      input.dataset.variable = varName;
      input.value = defaultValue;
      input.min = config.min || 0;
      input.max = config.max || undefined;
      input.step = config.step || 'any';

      group.appendChild(label);
      group.appendChild(input);
    }

    return group;
  }

  /**
   * Update results display
   */
  updateResults(results) {
    // Update total cost
    document.getElementById('total-cost-value').textContent = 
      '$' + results.total.toFixed(2);

    // Update service costs
    const serviceCostsContainer = document.getElementById('service-costs');
    serviceCostsContainer.innerHTML = '';

    results.breakdown.forEach(item => {
      const serviceItem = document.createElement('div');
      serviceItem.className = 'service-cost-item';

      serviceItem.innerHTML = `
        <div class="service-info">
          <span class="service-name">${item.service}</span>
          <span class="service-percentage">${item.percentage.toFixed(1)}%</span>
        </div>
        <span class="service-cost">$${item.cost.toFixed(2)}</span>
      `;

      serviceCostsContainer.appendChild(serviceItem);
    });

    // Update chart
    this.updateChart(results.breakdown);
  }

  /**
   * Setup chart
   */
  setupChart() {
    const ctx = document.getElementById('cost-chart').getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#2563eb', '#059669', '#d97706', '#dc2626', 
            '#7c3aed', '#0891b2', '#ca8a04', '#be185d'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = ((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Update chart with new data
   */
  updateChart(breakdown) {
    if (!this.chart) return;

    const labels = breakdown.map(item => item.service.charAt(0).toUpperCase() + item.service.slice(1));
    const data = breakdown.map(item => item.cost);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  }

  /**
   * Reset UI to defaults
   */
  resetToDefaults() {
    const defaults = this.configManager.getDefaultVariables(this.currentService);
    
    document.querySelectorAll('.variable-input').forEach(input => {
      const varName = input.dataset.variable;
      const defaultValue = defaults[varName] || 0;
      
      input.value = defaultValue;
      
      // Update range display if applicable
      if (input.type === 'range') {
        const valueDisplay = input.parentNode.querySelector('.range-value');
        if (valueDisplay) {
          valueDisplay.textContent = this.formatValue(varName, defaultValue);
        }
      }
    });

    // Reset global multipliers
    document.getElementById('volume-tier').value = 'small';
    document.getElementById('contract-type').value = 'pay_as_you_go';
    document.getElementById('support-level').value = 'community';
    document.getElementById('sla-level').value = 'best_effort';
  }

  /**
   * Update configuration timestamp
   */
  updateConfigTimestamp() {
    document.getElementById('config-timestamp').textContent = 
      new Date().toLocaleString();
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
}