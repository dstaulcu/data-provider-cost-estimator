# Quick Start Guide - Multi-System Cost Comparison

## What's New?

The cost estimator now supports comparing costs across multiple system configurations. This allows you to:
- Compare different infrastructure options side-by-side
- See how costs vary between standard, premium, and economy platforms
- Make informed decisions about system selection

## How to Use

### 1. Select Systems to Compare

When you load the application, you'll see a "System Selection" section with three options:

- **System A - Standard Platform** ✓ (selected by default)
  - Cost-effective solution using standard components
  
- **System B - Premium Platform**
  - High-performance solution with advanced components
  
- **System C - Economy Platform**
  - Budget-friendly solution for basic workloads

**To compare systems:**
- Check the boxes next to the systems you want to compare
- You can select 1, 2, or all 3 systems
- At least one system must be selected

### 2. Configure Service Parameters

Use the service parameter controls (same as before) to set:
- Data volumes
- Processing hours
- Query counts
- Priority levels
- Encryption requirements
- etc.

**Note:** The same parameters are applied to all selected systems for a fair comparison.

### 3. Calculate and Compare

Click the **Calculate Costs** button to see results:

**Single System Selected:**
- Total cost displayed at the top
- Service breakdown shown with percentages
- Doughnut chart shows proportional costs

**Multiple Systems Selected:**
- Primary system results shown (first selected system)
- **NEW**: System Cost Comparison chart appears below
- Bar chart shows all systems side-by-side
- Easy to see which system is more cost-effective for your workload

## Understanding the Results

### Cost Breakdown
Shows costs for each service:
- Transport
- Storage  
- Extraction
- Enrichment
- Modeling
- Search
- Exploration

### System Comparison Chart
- Each system shown in a different color
- Services grouped together for easy comparison
- Hover over bars to see exact costs

## Example Use Cases

### Case 1: Budget Optimization
**Goal:** Find the most cost-effective system

1. Select all three systems
2. Configure your typical workload parameters
3. Compare total costs
4. System C (Economy) will typically be 20-30% cheaper

### Case 2: Performance vs. Cost
**Goal:** Decide if premium features are worth the cost

1. Select System A (Standard) and System B (Premium)
2. Configure your performance-critical workload
3. Compare the cost difference
4. Decide if 20-50% higher cost justifies premium features

### Case 3: Service-Specific Analysis
**Goal:** Understand which services drive costs

1. Select your preferred system
2. Adjust parameters for different services
3. See how each service contributes to total cost
4. Use comparison chart to see cost distribution

## Tips

- **Start with one system** to understand baseline costs
- **Add systems gradually** to see incremental differences
- **Adjust parameters** to model different scenarios
- **Export configuration** to save your analysis
- **Use Advanced Settings** to apply global multipliers

## System Characteristics

### System A - Standard Platform
- **Best for:** General-purpose workloads
- **Storage:** Standard SSDs
- **Processing:** Shared CPU resources
- **Features:** All standard features included

### System B - Premium Platform  
- **Best for:** High-performance, mission-critical workloads
- **Storage:** High-speed NVMe SSDs with redundancy
- **Processing:** GPU acceleration, dedicated resources
- **Features:** Advanced algorithms, real-time processing, distributed architecture

### System C - Economy Platform
- **Best for:** Development, testing, non-critical batch workloads
- **Storage:** HDD-based storage
- **Processing:** Shared resources, batch-oriented
- **Features:** Basic features, longer processing times acceptable

## Need Help?

- Check configuration files in `/config/` for detailed cost breakdowns
- See `MULTI_SYSTEM_UPDATE.md` for technical details
- Contact support for custom system configurations
