# AWS to Huawei Cloud Quotation Generator

## Quick Start

1. **Download Template**: Get [AWS_Sample.xlsx](./AWS_Sample.xlsx) from this repository
2. **Edit File**: Replace sample data with your AWS EC2 instances
3. **Upload**: Visit the [web application](https://3000-i683g7rhnhlxqak3cgrzf-2b54fc91.sandbox.novita.ai)
4. **Generate**: Click "Generate Quotation" to get Huawei Cloud pricing
5. **Download**: Export detailed quotation as CSV

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
- **GitHub Repository**: https://github.com/antitown/QuoteMachine

## Data Architecture
- **Data Models**: 
  - EC2Instance: AWS instance specifications (name, type, region, OS, storage)
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

**Important**: Use one row per instance with unique instance names. The Count column is no longer used.

### 📥 Template Excel File

**Download Template**: [AWS_Sample.xlsx](./AWS_Sample.xlsx) - A ready-to-use template with example data

You can use this file as a template:
1. **Download** the `AWS_Sample.xlsx` file from the repository
2. **Replace** the sample data with your actual AWS instances
3. **Keep** the column headers exactly as shown
4. **Upload** to the application

### Required Columns

The Excel file should contain the following columns:

| Column Name | Required | Description | Example |
|------------|----------|-------------|---------|
| Instance Name | ✅ Yes | Unique name for the instance | web-server-01, db-server-02 |
| Instance Type | ✅ Yes | AWS EC2 instance type | t2.micro, m5.large, c5.xlarge |
| Region | No | AWS region (default: us-east-1) | us-east-1, ap-southeast-1 |
| OS | No | Operating system (default: Linux) | Linux, Windows |
| Storage | No | Storage size in GB (default: 100) | 100, 500 |
| Storage Type | No | Storage type (default: SSD) | SSD, HDD |

**Column Name Variations**: The parser accepts variations like `Instance Name`, `InstanceName`, `instance_name`, or `Name`.

### Sample Excel Data

**Note**: Each row represents one instance with a unique name.

```
Instance Name  | Instance Type | Region         | OS      | Storage | Storage Type
web-server-01  | t2.micro      | us-east-1      | Linux   | 100     | SSD
web-server-02  | t2.micro      | us-east-1      | Linux   | 100     | SSD
app-server-01  | m5.xlarge     | us-west-2      | Windows | 500     | SSD
api-server-01  | c5.2xlarge    | ap-southeast-1 | Linux   | 200     | SSD
api-server-02  | c5.2xlarge    | ap-southeast-1 | Linux   | 200     | SSD
api-server-03  | c5.2xlarge    | ap-southeast-1 | Linux   | 200     | SSD
db-server-01   | r5.large      | eu-west-1      | Linux   | 300     | SSD
db-server-02   | r5.large      | eu-west-1      | Linux   | 300     | SSD
```

### Creating Your Own Excel File

**Option 1: Use the Template**
1. Download `AWS_Sample.xlsx` from the repository
2. Open in Excel, Google Sheets, or LibreOffice
3. Replace sample data with your instances
4. Save and upload

**Option 2: Create from Scratch**
1. Create a new Excel file (.xlsx or .xls)
2. Add column headers in the first row:
   - `Instance Name`, `Instance Type`, `Region`, `OS`, `Storage`, `Storage Type`
3. Fill in your instance data (one row per instance)
4. Save and upload

**Option 3: Generate Programmatically**
Use the included script to generate a sample file:
```bash
cd /home/user/webapp
node create_sample.cjs
```

### Excel File Tips

✅ **Do:**
- Use unique, descriptive instance names
- Include all required columns (Instance Name, Instance Type)
- Use valid AWS instance types (see supported types below)
- Save as .xlsx or .xls format

❌ **Don't:**
- Use merged cells or complex formatting
- Leave Instance Type column empty
- Use special characters in instance names
- Include a Count column (deprecated in v2.1)

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
