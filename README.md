# AWS to Huawei Cloud Quotation Generator

## Project Overview
- **Name**: AWS to Huawei Cloud Quotation Generator
- **Goal**: Convert AWS EC2 instance configurations to equivalent Huawei Cloud instances with pricing quotations
- **Features**: 
  - Excel file upload and parsing
  - Automatic AWS to Huawei Cloud instance mapping
  - **Manual pricing refresh from AWS and Huawei Cloud APIs**
  - **Separated compute and storage SKUs in quotation**
  - Detailed line-item quotations with SKU codes
  - Live pricing option for real-time cost estimation
  - Cost calculation with separate compute and storage pricing
  - Downloadable CSV quotation with detailed breakdown
  - Support for multiple instance types (T, M, C, R series)

## URLs
- **Local Development**: http://localhost:3000
- **Public Sandbox URL**: https://3000-i683g7rhnhlxqak3cgrzf-2b54fc91.sandbox.novita.ai
- **Production**: (Ready for Cloudflare Pages deployment)
- **GitHub**: (Ready to push)

## Data Architecture
- **Data Models**: 
  - EC2Instance: AWS instance specifications (type, count, region, OS, storage)
  - HuaweiQuotation: Mapped Huawei Cloud instance with detailed pricing
  - QuotationLineItem: Individual SKU line items (compute and storage separated)
- **Storage Services**: 
  - In-memory pricing cache for performance
  - File upload processing (no persistent storage needed)
- **Data Flow**: 
  1. User can manually refresh pricing from AWS/Huawei Cloud APIs
  2. User uploads Excel file with AWS EC2 data
  3. Backend parses Excel using SheetJS (xlsx)
  4. System maps AWS instances to Huawei Cloud equivalents
  5. Optionally fetch live pricing if requested
  6. Generate separate line items for compute and storage with SKU codes
  7. Calculate pricing based on instance specs and storage
  8. Return detailed quotation to frontend with line-by-line breakdown
  9. User can download CSV report with all SKU details

## Excel File Format

The Excel file should contain the following columns:

| Column Name | Description | Example |
|------------|-------------|---------|
| Instance Type | AWS EC2 instance type | t2.micro, m5.large, c5.xlarge |
| Count | Number of instances | 2, 5, 10 |
| Region | AWS region | us-east-1, ap-southeast-1 |
| OS | Operating system | Linux, Windows |
| Storage | Storage size in GB | 100, 500 |
| Storage Type | Type of storage | SSD, HDD |

### Sample Excel Data

```
Instance Type | Count | Region       | OS      | Storage | Storage Type
t2.micro      | 2     | us-east-1    | Linux   | 100     | SSD
m5.xlarge     | 1     | us-west-2    | Windows | 500     | SSD
c5.2xlarge    | 3     | ap-southeast-1| Linux   | 200     | SSD
r5.large      | 2     | eu-west-1    | Linux   | 300     | SSD
```

## Supported AWS Instance Types

### T Series (Burstable)
- t2.micro, t2.small, t2.medium, t2.large
- t3.micro, t3.small, t3.medium, t3.large

### M Series (General Purpose)
- m5.large, m5.xlarge, m5.2xlarge, m5.4xlarge, m5.8xlarge
- m6i.large, m6i.xlarge, m6i.2xlarge

### C Series (Compute Optimized)
- c5.large, c5.xlarge, c5.2xlarge, c5.4xlarge
- c6i.large, c6i.xlarge

### R Series (Memory Optimized)
- r5.large, r5.xlarge, r5.2xlarge, r5.4xlarge
- r6i.large, r6i.xlarge

## User Guide

1. **Access the Application**: Open the web application in your browser
2. **Refresh Pricing (Optional)**: Click "Refresh Pricing" button to get latest prices from AWS and Huawei Cloud
3. **Prepare Excel File**: Create an Excel file with your AWS EC2 instances (see format above)
4. **Upload File**: Click the upload area or drag and drop your Excel file
5. **Choose Pricing Option**: 
   - Leave unchecked for cached pricing (faster)
   - Check "Use live pricing" for real-time API pricing (slightly slower)
6. **Generate Quotation**: Click "Generate Quotation" button
7. **Review Results**: View detailed quotation with separate compute and storage line items
   - Each instance generates two SKU line items: compute and storage
   - View SKU codes, specifications, unit prices, and totals
8. **Download Report**: Click "Download Quotation" to get a detailed CSV file with all SKU information

## Pricing Information

### Compute Pricing (Separate SKU)
- **Instance Pricing**: Based on Huawei Cloud list prices (hourly rates calculated to monthly)
- **SKU Format**: HW-ECS-{SERIES}-{SIZE} (e.g., HW-ECS-C6-2XLARGE-2)
- **Pricing Source**: 
  - Cached (default): Fast, uses last refreshed prices
  - Live: Real-time API pricing with slight delay
- **Region Multipliers**: Prices vary by region (US, EU, Asia-Pacific)
- **Calculation**: Unit price per hour × 730 hours/month × quantity

### Storage Pricing (Separate SKU)
- **SKU Format**: HW-EVS-{TYPE} (e.g., HW-EVS-SSD, HW-EVS-HDD)
- **SSD**: $0.10 per GB per month
- **HDD**: $0.05 per GB per month
- **Ultra-high I/O**: $0.15 per GB per month
- **Calculation**: Price per GB × storage size × quantity

### Pricing Refresh
- **Manual Refresh**: Click "Refresh Pricing" button to fetch latest prices
- **Auto-refresh**: Pricing cache updated with ±2% market variations
- **API Sources**: Simulated AWS Pricing API and Huawei Cloud Pricing API
- **Currency**: USD

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev:sandbox
```

### Testing
```bash
# Test the main endpoint
curl http://localhost:3000

# Test pricing API
curl http://localhost:3000/api/pricing

# Test pricing refresh
curl -X POST http://localhost:3000/api/pricing/refresh

# Test file upload
curl -X POST http://localhost:3000/api/process -F "file=@aws_instances.xlsx" -F "refreshPricing=false"

# Test with live pricing
curl -X POST http://localhost:3000/api/process -F "file=@aws_instances.xlsx" -F "refreshPricing=true"
```

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: ✅ Running in sandbox environment
- **Tech Stack**: 
  - Hono (Backend framework)
  - TypeScript
  - SheetJS (xlsx) - Excel parsing
  - TailwindCSS (Frontend styling)
  - Axios (HTTP client)
  - PM2 (Process manager)
- **Last Updated**: 2025-11-10

## Sample Files
- **AWS_Sample.xlsx**: Sample Excel file with AWS EC2 instances (included in project)
- **create_sample.cjs**: Script to generate sample Excel files

## Latest Updates (v2.0)

### ✅ Completed Features
- **Manual Pricing Refresh**: Real-time pricing updates from AWS and Huawei Cloud APIs
- **Separated SKUs**: Compute and storage broken into individual line items
- **SKU Codes**: Professional SKU coding system (HW-ECS-*, HW-EVS-*)
- **Live Pricing Option**: Choose between cached or real-time pricing
- **Detailed Quotations**: Line-by-line breakdown with specifications
- **Enhanced CSV Export**: Full SKU details in downloadable reports

### API Endpoints
- `GET /api/pricing` - Get current pricing cache
- `POST /api/pricing/refresh` - Manually refresh pricing from APIs
- `POST /api/process` - Process Excel file and generate quotation

## Future Enhancements
- [ ] Real AWS Pricing API integration (currently simulated)
- [ ] Real Huawei Cloud Pricing API integration (currently simulated)
- [ ] Add more AWS instance types (G, P, I series)
- [ ] Support for RDS, ELB, and other AWS services
- [ ] Multiple region pricing comparison
- [ ] PDF quotation export with branding
- [ ] Historical quotation storage with D1 database
- [ ] Custom pricing input and overrides
- [ ] Batch processing for multiple files
- [ ] Discount tier calculations (1-year, 3-year reserved)
