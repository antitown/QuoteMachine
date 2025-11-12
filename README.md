# AWS to Huawei Cloud Estimate Generator

## Quick Start

1. **Download Template**: Get [AWS_Sample.xlsx](https://github.com/antitown/QuoteMachine/raw/main/AWS_Sample.xlsx) from GitHub
2. **Edit File**: Replace sample data with your AWS EC2 instances
3. **Upload**: Visit the web application
4. **Generate**: Click "Generate Estimate" to get comprehensive AWS vs Huawei Cloud pricing comparison
5. **Download**: Export detailed estimate as Excel (.xlsx) with multiple pricing models

## Project Overview
- **Name**: AWS to Huawei Cloud Estimate Generator
- **Version**: 4.0
- **Goal**: Provide comprehensive AWS vs Huawei Cloud cost comparison with multiple pricing models
- **Features**: 
  - **4 Pricing Models**: AWS PAYG, AWS 1Y RI, Huawei PAYG, Huawei 1Y Commitment
  - **Accurate AWS Storage Pricing**: EBS gp3/gp2/io2/st1/sc1 per-GB pricing
  - **Reserved Instance Pricing**: AWS 1-Year RI with 35% discount (All Upfront)
  - **Focused Savings Analysis**: Clear comparison vs AWS PAYG and RI pricing
  - Excel file upload and parsing (supports .xlsx, .xls)
  - Automatic AWS to Huawei Cloud instance mapping (28 instance types)
  - Editable instance mapping with web UI
  - Manual pricing refresh from Huawei Cloud API
  - Detailed line-item estimates with SKU codes
  - Live pricing option for real-time cost estimation
  - **Professional Excel export** with Detailed Estimate and Summary sheets
  - Annual savings calculation
  - Support for multiple instance types (T, M, C, R series)

## URLs
- **Local Development**: http://localhost:3000
- **Production**: Ready for Cloudflare Pages deployment
- **GitHub Repository**: https://github.com/antitown/QuoteMachine
- **Template Download**: https://github.com/antitown/QuoteMachine/raw/main/AWS_Sample.xlsx

## Data Architecture
- **Data Models**: 
  - EC2Instance: AWS instance specifications (name, type, region, OS, storage)
  - HuaweiQuotation: Mapped Huawei Cloud instance with all 4 pricing models
  - QuotationLineItem: Individual SKU line items (compute and storage separated)
  - Pricing Structure: Nested object with AWS (PAYG + 1Y RI) and Huawei (PAYG + 1Y Commitment)
- **Storage Services**: 
  - In-memory pricing cache for Huawei Cloud compute pricing
  - Cached AWS EBS storage pricing (gp3/gp2/io2/st1/sc1)
  - Cached AWS Reserved Instance discounts
  - JSON configuration files in `/public/data/`
  - File upload processing (no persistent storage needed)
- **Data Flow**: 
  1. User can manually refresh pricing from Huawei Cloud API
  2. User can manage AWS to Huawei instance mappings via web UI
  3. User uploads Excel file with AWS EC2 data
  4. Backend parses Excel using SheetJS (xlsx)
  5. System maps AWS instances to Huawei Cloud equivalents
  6. Optionally fetch live pricing if requested
  7. Calculate AWS pricing (PAYG and 1Y RI) using cached rates
  8. Calculate Huawei pricing (PAYG and 1Y Commitment)
  9. Calculate savings vs AWS PAYG and AWS RI
  10. Return detailed estimate to frontend with all 4 models
  11. User can download Excel report with:
      - Detailed Estimate sheet (all pricing models per instance)
      - Summary sheet (comparison table, savings breakdown, recommendations)

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
2. **Download Template** (Optional): Click the template download link to get sample Excel file
3. **Manage Mappings** (Optional): Click "Manage Mappings" to view/edit/add AWS to Huawei instance mappings
4. **Refresh Pricing** (Optional): Click "Refresh Pricing" to get latest prices from Huawei Cloud API
5. **Prepare Excel File**: Create an Excel file with your AWS EC2 instances (see format above)
6. **Upload File**: Click the upload area or drag and drop your Excel file
7. **Choose Pricing Option**: 
   - Leave unchecked for cached pricing (faster, recommended)
   - Check "Use live pricing" for real-time API pricing (slightly slower)
8. **Generate Estimate**: Click "Generate Estimate" button
9. **Review Results**: View comprehensive comparison with all 4 pricing models
   - **Pricing Comparison Cards**: See AWS PAYG, AWS 1Y RI, Huawei PAYG, Huawei 1Y per instance
   - **Line Item Detail**: Huawei PAYG and 1Y Commitment for compute and storage SKUs
   - **Grand Total Table**: All models compared with savings vs AWS
   - **Savings Highlight**: Monthly and annual savings vs AWS PAYG and RI
   - **Clear Recommendation**: Huawei 1Y Commitment highlighted as best value
10. **Download Report**: Click "Download Estimate (Excel)" to get comprehensive report:
    - **Detailed Estimate Sheet**: All instances with 15 columns of pricing data
    - **Summary Sheet**: Pricing model comparison, savings analysis, recommendations

## Pricing Information

### All Pricing Models (V4.0)
The estimate generator provides **4 pricing models** for comprehensive comparison:

#### 1. AWS Pay-As-You-Go (PAYG)
- **Billing**: On-demand hourly usage
- **Flexibility**: No commitment, pay only for what you use
- **Best For**: Variable workloads, testing, short-term projects
- **Calculation**: 
  - Compute: Hourly rate × 730 hours/month
  - Storage: Per-GB rate × storage size (EBS gp3/gp2/io2/st1)

#### 2. AWS 1-Year Reserved Instance (All Upfront)
- **Billing**: 1-year commitment with upfront payment
- **Discount**: 35% off on-demand pricing
- **Best For**: Predictable, steady-state workloads
- **Calculation**: AWS PAYG monthly × 0.65 (compute only)
- **Notes**: Storage pricing same as PAYG (no RI discount)

#### 3. Huawei Cloud Pay-As-You-Go
- **Billing**: Hourly usage converted to monthly estimate
- **Flexibility**: No commitment
- **Best For**: Variable workloads, cost comparison
- **Calculation**: Hourly rate × 730 hours/month

#### 4. Huawei Cloud 1-Year Commitment (RECOMMENDED)
- **Billing**: 1-year subscription with monthly billing
- **Discounts**: 
  - **15% off compute pricing** (ECS instances)
  - **10% off storage pricing** (EVS volumes)
- **Best For**: Production workloads, maximum savings
- **Calculation**: 
  - Compute: Huawei PAYG monthly × 0.85
  - Storage: Huawei PAYG monthly × 0.90

### AWS Compute Pricing
- **Pricing Source**: Static pricing data (US East N. Virginia)
- **28 Instance Types**: t2/t3 (Burstable), m5/m6i (General Purpose), c5/c6i (Compute), r5/r6i (Memory)
- **PAYG Calculation**: Hourly rate × 730 hours/month
- **RI 1Y Calculation**: PAYG monthly × 0.65 (35% discount)

### AWS Storage Pricing (EBS)
- **SKU Format**: Automatically mapped from Huawei storage type
- **Pricing Source**: Cached in `/public/data/aws-ebs-pricing.json`
- **Storage Types**:
  - **gp3** (General Purpose SSD): $0.08 per GB/month (default for SSD)
  - **gp2** (General Purpose SSD): $0.10 per GB/month
  - **io2** (Provisioned IOPS SSD): $0.125 per GB/month (for Ultra-high I/O)
  - **st1** (Throughput Optimized HDD): $0.045 per GB/month (for HDD)
  - **sc1** (Cold HDD): $0.015 per GB/month
- **Calculation**: Price per GB × storage size

### Huawei Cloud Compute Pricing
- **Instance Pricing**: Based on Huawei Cloud API list prices
- **SKU Format**: HW-ECS-{SERIES}-{SIZE} (e.g., HW-ECS-C6-2XLARGE-2)
- **Pricing Source**: 
  - Cached (default): Fast, uses last refreshed prices
  - Live: Real-time API pricing with slight delay
- **Region**: ap-southeast-1 (default)
- **PAYG Calculation**: Hourly rate × 730 hours/month
- **1Y Commitment Calculation**: PAYG monthly × 0.85 (15% discount)

### Huawei Cloud Storage Pricing
- **SKU Format**: HW-EVS-{TYPE} (e.g., HW-EVS-SSD, HW-EVS-HDD)
- **Base Rates (PAYG)**:
  - **SSD**: $0.10 per GB per month
  - **HDD**: $0.05 per GB per month
  - **Ultra-high I/O**: $0.15 per GB per month
- **PAYG Calculation**: Price per GB × storage size
- **1Y Commitment Calculation**: PAYG monthly × 0.90 (10% discount)

### Estimate Output Features (V4.0)
- **4-Model Comparison**: View AWS PAYG, AWS 1Y RI, Huawei PAYG, Huawei 1Y side-by-side
- **Pricing Comparison Cards**: Visual cards showing all 4 models per instance
- **Savings Analysis**: 
  - Savings vs AWS PAYG (monthly + percentage)
  - Savings vs AWS 1Y RI (monthly + percentage)
  - Annual savings projection
- **Grand Total Table**: Professional comparison with all models ranked
- **Recommendations**: Clear guidance on best-value option (Huawei 1Y Commitment)
- **Excel Export**: Two-sheet workbook
  - **Detailed Estimate**: 15 columns with all pricing models per instance
  - **Summary**: Comparison table, savings breakdown, annual projection
- **No Quotation IDs**: Streamlined output focused on comparison

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
- **Last Updated**: 2025-01-12 (V4.0)

## Sample Files
- **AWS_Sample.xlsx**: Sample Excel file with AWS EC2 instances (included in project)
- **create_sample.cjs**: Script to generate sample Excel files

## Latest Updates (V4.0 - January 2025)

### 🎉 Major Update: Complete AWS Comparison

#### ✅ New Features
1. **4 Pricing Models**: Complete comparison across all pricing options
   - AWS Pay-As-You-Go (on-demand baseline)
   - AWS 1-Year Reserved Instance (35% discount)
   - Huawei Cloud Pay-As-You-Go
   - Huawei Cloud 1-Year Commitment (15% compute + 10% storage discount)

2. **AWS Reserved Instance Pricing**
   - Industry-standard 35% discount for 1Y All Upfront RI
   - Realistic apples-to-apples comparison (1Y vs 1Y)
   - Separate AWS RI savings analysis

3. **Accurate AWS Storage Pricing**
   - EBS gp3: $0.08/GB (default for SSD)
   - EBS gp2: $0.10/GB
   - EBS io2: $0.125/GB (Ultra-high I/O)
   - EBS st1: $0.045/GB (HDD)
   - Cached in `/public/data/aws-ebs-pricing.json`

4. **Focused Savings Analysis**
   - Removed internal Huawei PAYG vs Subscription comparison
   - Added comprehensive AWS comparison:
     - Huawei 1Y vs AWS PAYG (monthly + annual savings)
     - Huawei 1Y vs AWS 1Y RI (monthly + annual savings)
   - Percentage savings for each comparison

5. **Streamlined Output**
   - Removed Quotation ID column (cleaner interface)
   - Professional pricing model comparison table
   - Clear "RECOMMENDED" highlighting for best value
   - Enhanced Excel export with Summary sheet

6. **Professional Excel Export**
   - **Detailed Estimate Sheet** (15 columns):
     - Instance Name, AWS Instance, Huawei Instance, vCPU, Memory, Storage
     - AWS PAYG Monthly, AWS 1Y RI Monthly
     - Huawei PAYG Monthly, Huawei 1Y Commitment
     - Savings vs AWS PAYG, Savings %, Region, OS
   - **Summary Sheet**:
     - Pricing Model Comparison table
     - Savings Breakdown (monthly and annual)
     - Clear Recommendations

### 🔧 Technical Improvements
- New pricing cache files for AWS EBS and RI pricing
- Restructured data model with nested pricing objects
- Updated all pricing calculations for 4-model support
- Enhanced frontend UI with comparison cards
- Improved savings visualization

### 📋 Previous Features (Maintained)
- Manual Pricing Refresh from Huawei Cloud API
- Instance Mapping Editor with add/edit/delete functionality
- Separated SKUs for compute and storage
- Professional SKU coding system (HW-ECS-*, HW-EVS-*)
- Live Pricing Option for real-time cost estimation
- Support for 28 AWS instance types (T, M, C, R series)
- Template Excel file download

### API Endpoints
- `GET /api/pricing` - Get current Huawei Cloud pricing cache
- `POST /api/pricing/refresh` - Manually refresh pricing from Huawei Cloud API
- `GET /api/mappings` - Get all AWS to Huawei instance mappings
- `POST /api/mappings` - Update all instance mappings (bulk save)
- `PUT /api/mappings/:awsInstance` - Update single mapping
- `DELETE /api/mappings/:awsInstance` - Delete mapping
- `GET /api/aws-pricing` - Get AWS compute pricing data
- `POST /api/process` - Process Excel file and generate comprehensive estimate

## Huawei Cloud API Integration

### Authentication
The application uses **SDK-HMAC-SHA256** signature algorithm for Huawei Cloud BSS API authentication:
- **Access Key (AK)**: HPUAJD0HGGJTMY29QRWH
- **Secret Key (SK)**: xoCcwDv7gkk6HjKvh9BL7kbsOBHnG2Ba6UFyEco3
- **Project ID**: 05602429108026242f3ec01e93f02298
- **Account Reference**: APClouddemoHK
- **API Endpoint**: https://bss-intl.myhuaweicloud.com
- **Default Region**: ap-southeast-1

### Pricing Refresh Workflow
1. **Manual Trigger**: User clicks "Refresh Pricing" button in the web interface
2. **API Calls**: Backend makes real Huawei Cloud BSS API calls for each instance type
3. **Cache Update**: Live pricing data updates the in-memory cache
4. **Fast Quotations**: Subsequent quotation generation uses cached data for speed

### Instance Mapping Indicators
The quotation includes visual indicators for mapping quality:
- **✓ Exact Match**: AWS instance has direct equivalent in Huawei Cloud (e.g., t3.micro → s6.small.1)
- **⚠️ Best Match**: AWS instance not in mapping dictionary, uses generic equivalent (c6.2xlarge.2)

### API Test Endpoint
Test the Huawei Cloud API integration:
```bash
curl http://localhost:3000/api/test-huawei
```

## Future Enhancements
- [x] ~~Real Huawei Cloud Pricing API integration~~ ✅ **COMPLETED**
- [x] ~~AWS Reserved Instance pricing~~ ✅ **COMPLETED (V4.0)**
- [x] ~~AWS EBS storage pricing~~ ✅ **COMPLETED (V4.0)**
- [x] ~~Multiple pricing models comparison~~ ✅ **COMPLETED (V4.0)**
- [x] ~~Instance mapping editor~~ ✅ **COMPLETED (V3.0)**
- [ ] Per-instance AWS RI pricing (currently using fixed 35% discount)
- [ ] 3-Year commitment pricing (AWS and Huawei)
- [ ] Real-time AWS Pricing API integration
- [ ] Expand AWS to Huawei instance mapping (more instance types)
- [ ] GPU instances (G, P series)
- [ ] Storage-optimized instances (I, D series)
- [ ] Support for RDS, ELB, and other AWS services
- [ ] Regional pricing comparison (multiple regions)
- [ ] PDF estimate export with branding
- [ ] Historical estimate storage with D1 database
- [ ] Custom pricing input and overrides
- [ ] Batch processing for multiple files
- [ ] Currency support (EUR, GBP, CNY)
- [ ] Enterprise volume discounts
