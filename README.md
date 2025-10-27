# Data Provider Cost Estimator

A web-based cost estimation tool for data service providers specializing in transport, storage, extraction, enrichment, modeling, search, and exploration of various data types.

## Features

- 🧮 **Flexible Cost Calculation Engine** - Handles complex pricing models for data services
- ⚙️ **Configuration Management** - Version-controlled cost variables and formulas
- 🌐 **Static Web Deployment** - Optimized for S3 hosting with CDN support
- 📊 **Interactive Interface** - Real-time cost adjustments and visualization
- 🔄 **Continuous Improvement** - Framework for iterating on cost formulas over time

## Architecture

### Frontend
- Vanilla JavaScript/HTML/CSS for maximum compatibility
- Vite for build optimization and development
- Chart.js for cost visualization
- Responsive design for mobile and desktop

### Configuration Management
- YAML/JSON configuration files for cost variables
- JSON Schema validation for configuration integrity
- Version control friendly format for easy tracking of changes

### Deployment
- Static assets optimized for S3 hosting
- Environment-specific configuration support

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Deploy to S3:**
   ```bash
   export S3_BUCKET_NAME=your-bucket-name
   npm run deploy
   ```

## Configuration

Cost variables and formulas are managed through configuration files in the `config/` directory:

- `config/base-costs.yaml` - Base pricing for different service types
- `config/formulas.yaml` - Cost calculation formulas
- `config/multipliers.yaml` - Volume and complexity multipliers

## Project Structure

```
├── src/                    # Source code
│   ├── index.html         # Main application entry point
│   ├── js/                # JavaScript modules
│   ├── css/               # Stylesheets
│   └── components/        # Reusable UI components
├── config/                # Cost configuration files
├── public/                # Static assets
├── scripts/               # Build and deployment scripts
└── docs/                  # Documentation
```

## Contributing

1. Update configuration files in `config/`
2. Validate changes: `npm run validate-config`
3. Test locally: `npm run dev`
4. Commit changes and create pull request

## License

MIT License - see LICENSE file for details.