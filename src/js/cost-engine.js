/**
 * Cost Calculation Engine
 * Handles complex cost calculations for data services
 */

export class CostCalculationEngine {
  constructor(config) {
    this.baseCosts = config.baseCosts || {};
    this.formulas = config.formulas || {};
    this.multipliers = config.multipliers || {};
    this.systems = config.systems || {};
    this.variables = new Map();
    this.currentSystemCosts = {};
  }

  /**
   * Set system-specific costs
   */
  setSystemCosts(systemId, costs) {
    this.currentSystemCosts = costs;
  }

  /**
   * Set a variable value for cost calculations
   */
  setVariable(name, value) {
    this.variables.set(name, value);
  }

  /**
   * Get current variable value
   */
  getVariable(name) {
    return this.variables.get(name) || 0;
  }

  /**
   * Calculate cost for a specific service type with specific system costs
   */
  calculateServiceCost(serviceType, parameters = {}) {
    const formula = this.formulas[serviceType];
    if (!formula) {
      throw new Error(`No formula found for service type: ${serviceType}`);
    }

    // Merge system costs, parameters, and current variables
    const context = { 
      ...this.currentSystemCosts,
      ...Object.fromEntries(this.variables), 
      ...parameters 
    };
    
    return this.evaluateFormula(formula, context);
  }

  /**
   * Check if a system supports a specific service
   */
  checkServiceSupport(serviceType, systemCosts) {
    // Get required cost variables for this service from the formula
    const requiredVars = this.getRequiredVariables(serviceType);
    
    // Check if system has all required cost components in its YAML configuration
    // We only check systemCosts (from YAML), not user input variables
    for (const varName of requiredVars) {
      if (!(varName in systemCosts)) {
        console.log(`⊘ ${serviceType}: Not supported - missing component '${varName}'`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get required variables for a service from its formula
   */
  getRequiredVariables(serviceType) {
    const formula = this.formulas[serviceType];
    const requiredVars = new Set();
    
    // Extract variable names from formula strings
    const extractVars = (str) => {
      if (typeof str === 'string') {
        const matches = str.matchAll(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g);
        for (const match of matches) {
          // Only include cost variables (those ending in _per_*, _cost, _price, etc.)
          const varName = match[1];
          if (varName.includes('_per_') || varName.includes('_cost') || 
              varName.includes('_price') || varName.includes('_base')) {
            requiredVars.add(varName);
          }
        }
      }
    };
    
    // Recursively extract from formula object
    const traverse = (obj) => {
      if (typeof obj === 'string') {
        extractVars(obj);
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(traverse);
      }
    };
    
    traverse(formula);
    return Array.from(requiredVars);
  }

  /**
   * Calculate total cost across all services for a specific system
   */
  calculateTotalCost(serviceParameters = {}) {
    const costs = {};
    const supportedServices = [];
    const unsupportedServices = [];
    let total = 0;

    console.log('Calculating total cost for all services...');

    for (const serviceType of Object.keys(this.formulas)) {
      // Check if this system supports this service
      if (!this.checkServiceSupport(serviceType, this.currentSystemCosts)) {
        console.log(`⊘ ${serviceType}: Not supported by this system`);
        costs[serviceType] = null; // null indicates unsupported
        unsupportedServices.push(serviceType);
        continue;
      }
      
      try {
        const serviceCost = this.calculateServiceCost(serviceType, serviceParameters[serviceType] || {});
        costs[serviceType] = serviceCost;
        supportedServices.push(serviceType);
        console.log(`✓ ${serviceType} cost: $${serviceCost.toFixed(2)}`);
        
        if (!isNaN(serviceCost)) {
          total += serviceCost;
        } else {
          console.warn(`${serviceType} returned NaN, skipping from total`);
        }
      } catch (error) {
        console.error(`Error calculating ${serviceType} cost:`, error);
        costs[serviceType] = 0;
      }
    }

    console.log(`Supported services: ${supportedServices.length}/${Object.keys(this.formulas).length}`);
    if (unsupportedServices.length > 0) {
      console.log(`Unsupported: ${unsupportedServices.join(', ')}`);
    }

    return {
      services: costs,
      total,
      breakdown: this.generateCostBreakdown(costs),
      supportedServices,
      unsupportedServices
    };
  }

  /**
   * Calculate costs for multiple systems
   */
  calculateMultiSystemCosts(systemIds, serviceParameters = {}) {
    const results = [];

    for (const systemId of systemIds) {
      const systemCosts = this.systems[systemId]?.components || {};
      this.setSystemCosts(systemId, systemCosts);
      
      const result = this.calculateTotalCost(serviceParameters);
      results.push({
        systemId,
        ...result
      });
    }

    return results;
  }

  /**
   * Evaluate formula with given context
   */
  evaluateFormula(formula, context) {
    if (typeof formula === 'number') {
      return formula;
    }

    if (typeof formula === 'string') {
      // Handle variable references
      if (formula.startsWith('$')) {
        const varName = formula.substring(1);
        return context[varName] || 0;
      }
      
      // Handle formula expressions
      return this.evaluateExpression(formula, context);
    }

    if (typeof formula === 'object' && formula !== null) {
      return this.evaluateComplexFormula(formula, context);
    }

    return 0;
  }

  /**
   * Evaluate mathematical expressions safely
   */
  evaluateExpression(expression, context) {
    console.log('Evaluating expression:', expression);
    console.log('Context:', context);
    
    // Replace variables in expression
    let processedExpression = expression;
    
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && value !== null) {
        const regex = new RegExp(`\\$${key}\\b`, 'g');
        processedExpression = processedExpression.replace(regex, value);
      }
    }

    console.log('Processed expression:', processedExpression);

    // Check for any remaining unreplaced variables
    const unreplacedVars = processedExpression.match(/\$\w+/g);
    if (unreplacedVars) {
      console.warn('Unreplaced variables found:', unreplacedVars);
      // Replace unreplaced variables with 0
      for (const unreplacedVar of unreplacedVars) {
        const varName = unreplacedVar.substring(1);
        console.warn(`Setting missing variable ${varName} to 0`);
        processedExpression = processedExpression.replace(new RegExp(`\\${unreplacedVar}\\b`, 'g'), '0');
      }
    }

    console.log('Final processed expression:', processedExpression);

    // Safe evaluation of mathematical expressions
    try {
      // Remove any non-mathematical characters for safety
      const safeExpression = processedExpression.replace(/[^0-9+\-*/().\s]/g, '');
      console.log('Safe expression:', safeExpression);
      
      if (safeExpression.trim() === '') {
        console.warn('Empty expression after processing');
        return 0;
      }
      
      const result = Function(`"use strict"; return (${safeExpression})`)();
      console.log('Expression result:', result);
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error('Error evaluating expression:', expression, error);
      return 0;
    }
  }

  /**
   * Evaluate complex formula objects
   */
  evaluateComplexFormula(formula, context) {
    if (formula.type === 'tiered') {
      return this.evaluateTieredFormula(formula, context);
    }

    if (formula.type === 'multiplier') {
      return this.evaluateMultiplierFormula(formula, context);
    }

    if (formula.type === 'conditional') {
      return this.evaluateConditionalFormula(formula, context);
    }

    // Default: sum all numeric values in the formula object
    let total = 0;
    for (const value of Object.values(formula)) {
      if (typeof value === 'number') {
        total += value;
      } else {
        total += this.evaluateFormula(value, context);
      }
    }

    return total;
  }

  /**
   * Evaluate tiered pricing formulas
   */
  evaluateTieredFormula(formula, context) {
    const volume = context[formula.volumeVar] || 0;
    const tiers = formula.tiers || [];
    
    let cost = 0;
    let remainingVolume = volume;

    for (const tier of tiers) {
      if (remainingVolume <= 0) break;

      const tierVolume = Math.min(remainingVolume, tier.limit || remainingVolume);
      
      // Evaluate the rate expression if it's a string, otherwise use as number
      let rate = tier.rate;
      if (typeof rate === 'string') {
        rate = this.evaluateExpression(rate, context);
      }
      
      cost += tierVolume * rate;
      remainingVolume -= tierVolume;
    }

    return cost;
  }

  /**
   * Evaluate multiplier-based formulas
   */
  evaluateMultiplierFormula(formula, context) {
    console.log('Evaluating multiplier formula:', formula);
    console.log('Formula base expression:', formula.base);
    console.log('Context keys available:', Object.keys(context));
    console.log('Context values for transport variables:', {
      data_volume_gb: context.data_volume_gb,
      ingestion_cost_per_gb: context.ingestion_cost_per_gb,
      egress_volume_gb: context.egress_volume_gb,
      egress_cost_per_gb: context.egress_cost_per_gb,
      bandwidth_base_cost: context.bandwidth_base_cost
    });
    
    const baseValue = this.evaluateExpression(formula.base, context);
    console.log('Base value:', baseValue);
    
    let multiplier = 1;

    for (const mult of formula.multipliers || []) {
      const factor = context[mult.variable] || 1;
      console.log(`Multiplier ${mult.variable}: ${factor}, factor: ${mult.factor}`);
      // Fix: Apply multiplier correctly - if variable is 1, no multiplier, if 2 then 1.5x, if 3 then 1.5x again
      if (factor > 1) {
        multiplier *= Math.pow(mult.factor, factor - 1);
      }
    }

    console.log('Final multiplier:', multiplier);
    const result = baseValue * multiplier;
    console.log('Multiplier formula result:', result);
    return isNaN(result) ? 0 : result;
  }

  /**
   * Evaluate conditional formulas
   */
  evaluateConditionalFormula(formula, context) {
    for (const condition of formula.conditions || []) {
      if (this.evaluateCondition(condition.if, context)) {
        // Evaluate the 'then' clause as an expression if it's a string
        if (typeof condition.then === 'string') {
          return this.evaluateExpression(condition.then, context);
        } else {
          return this.evaluateFormula(condition.then, context);
        }
      }
    }

    // Evaluate the 'else' clause as an expression if it's a string
    const elseClause = formula.else || 0;
    if (typeof elseClause === 'string') {
      return this.evaluateExpression(elseClause, context);
    } else {
      return this.evaluateFormula(elseClause, context);
    }
  }

  /**
   * Evaluate a condition
   */
  evaluateCondition(condition, context) {
    const { variable, operator, value } = condition;
    const varValue = context[variable] || 0;

    switch (operator) {
      case '>': return varValue > value;
      case '>=': return varValue >= value;
      case '<': return varValue < value;
      case '<=': return varValue <= value;
      case '==': return varValue == value;
      case '!=': return varValue != value;
      default: return false;
    }
  }

  /**
   * Generate detailed cost breakdown
   */
  generateCostBreakdown(costs) {
    const breakdown = [];
    
    for (const [service, cost] of Object.entries(costs)) {
      // Skip services that are null (unsupported)
      if (cost === null) {
        continue;
      }
      
      breakdown.push({
        service,
        cost,
        percentage: 0 // Will be calculated later
      });
    }

    const total = breakdown.reduce((sum, item) => sum + item.cost, 0);
    breakdown.forEach(item => {
      item.percentage = total > 0 ? (item.cost / total) * 100 : 0;
    });

    return breakdown.sort((a, b) => b.cost - a.cost);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.baseCosts = { ...this.baseCosts, ...newConfig.baseCosts };
    this.formulas = { ...this.formulas, ...newConfig.formulas };
    this.multipliers = { ...this.multipliers, ...newConfig.multipliers };
  }

  /**
   * Export current state for debugging
   */
  exportState() {
    return {
      variables: Object.fromEntries(this.variables),
      baseCosts: this.baseCosts,
      formulas: this.formulas,
      multipliers: this.multipliers
    };
  }
}