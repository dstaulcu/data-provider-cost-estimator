# Multi-System Cost Estimator Update

## Overview
Updated the Data Provider Cost Estimator to support multiple systems with different components and costs, allowing users to compare costs across different system configurations.

## Changes Made

### 1. Configuration Schema Updates

#### `config/base-costs.yaml` and `public/config/base-costs.yaml`
- Restructured to support multiple systems
- Added three default systems:
  - **System A - Standard Platform**: Cost-effective solution using standard components
  - **System B - Premium Platform**: High-performance solution with advanced components (20-50% higher costs)
  - **System C - Economy Platform**: Budget-friendly solution for basic workloads (30% lower costs)
- Each system has its own component costs for all services

### 2. Frontend Updates

#### `src/index.html`
- Added system selection section with checkboxes
- Added new comparison chart container for multi-system visualization
- Maintains existing service parameter controls

#### `src/css/styles.css`
- Added styles for system selection UI:
  - `.system-selection` - Container for system checkboxes
  - `.system-checkbox-item` - Individual system selection items
  - `.system-info` - System name and description display
  - Hover and selection states for better UX

### 3. JavaScript Module Updates

#### `src/js/config-manager.js`
- Added `getSystems()` - Returns all available systems
- Added `getSystemCosts(systemId)` - Returns costs for a specific system
- Added `getSystemInfo(systemId)` - Returns system metadata (name, description)
- Updated `loadConfig()` to extract and store system information

#### `src/js/cost-engine.js`
- Added `setSystemCosts(systemId, costs)` - Sets system-specific costs for calculations
- Added `calculateMultiSystemCosts(systemIds, serviceParameters)` - Calculates costs for multiple systems simultaneously
- Updated `calculateServiceCost()` to merge system costs into calculation context
- Maintains backward compatibility with single-system calculations

#### `src/js/ui-controller.js`
- Added `setupSystemSelection()` - Creates system selection checkboxes with descriptions
- Added `setupComparisonChart()` - Initializes bar chart for system comparison
- Added `updateComparisonChart(systemResults)` - Updates comparison chart with multi-system data
- Added `getSelectedSystems()` - Returns currently selected system IDs
- First system is selected by default
- Comparison chart only displays when 2+ systems are selected

#### `src/js/main.js`
- Updated `calculateCosts()` to handle both single and multi-system scenarios
- Single system: Normal calculation and display
- Multiple systems: Calculates all systems, displays first system in main view, shows comparison chart
- Updated `loadDefaultVariables()` to initialize with first system's costs

## Features

### System Selection
- Users can select one or more systems via checkboxes
- Each system shows its name and description
- Visual feedback for selected systems
- At least one system must be selected

### Cost Comparison
- When multiple systems are selected:
  - Primary results show the first selected system
  - Comparison chart displays all selected systems side-by-side
  - Bar chart shows cost breakdown by service for each system
- Color-coded for easy visual comparison

### System Configurations

#### System A - Standard Platform
- Baseline costs for all services
- Good balance of performance and cost
- Suitable for typical workloads

#### System B - Premium Platform
- 20-50% higher costs
- Optimized for:
  - High performance (GPU acceleration, faster storage)
  - Advanced features (distributed architecture)
  - Real-time processing capabilities

#### System C - Economy Platform
- 20-30% lower costs
- Optimized for:
  - Budget-conscious workloads
  - Basic processing needs
  - Batch processing over real-time

## Usage

1. **Select Systems**: Check one or more systems in the System Selection panel
2. **Configure Parameters**: Adjust service parameters as needed (applies to all systems)
3. **Calculate**: Click "Calculate Costs" to see results
4. **Compare**: If multiple systems selected, view the comparison chart showing cost differences

## Technical Details

### Data Flow
1. User selects systems via checkboxes
2. User configures service parameters
3. On calculate:
   - If 1 system: Single calculation → Display results
   - If 2+ systems: Multi-system calculation → Display primary + comparison chart
4. Each system uses its own component costs from configuration
5. Same service parameters applied across all systems for fair comparison

### Chart Types
- **Doughnut Chart**: Shows service cost breakdown for selected/primary system
- **Bar Chart**: Shows side-by-side comparison of all selected systems by service

### Backward Compatibility
- Existing single-system workflow remains unchanged
- Default behavior selects first system automatically
- All existing formulas and calculations work as before

## Future Enhancements

Potential additions:
- Custom system creation/editing
- System presets for specific use cases
- Export comparison reports
- Cost optimization recommendations
- System performance metrics alongside costs
- Time-based cost projections
