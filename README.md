# AWS to Huawei Cloud Quotation Generator

## Project Overview
- **Name**: AWS to Huawei Cloud Quotation Generator
- **Goal**: Convert AWS EC2 instance configurations to equivalent Huawei Cloud instances with pricing quotations
- **Features**: 
  - Excel file upload and parsing
  - Automatic AWS to Huawei Cloud instance mapping
  - Cost calculation with storage pricing
  - Downloadable CSV quotation
  - Support for multiple instance types (T, M, C, R series)

## URLs
- **Local Development**: http://localhost:3000
- **Production**: (To be deployed)
- **GitHub**: (To be configured)

## Data Architecture
- **Data Models**: 
  - EC2Instance: AWS instance specifications (type, count, region, OS, storage)
  - HuaweiQuotation: Mapped Huawei Cloud instance with pricing
- **Storage Services**: File upload processing (in-memory, no persistent storage needed)
- **Data Flow**: 
  1. User uploads Excel file with AWS EC2 data
  2. Backend parses Excel using SheetJS (xlsx)
  3. System maps AWS instances to Huawei Cloud equivalents
  4. Calculate pricing based on instance specs and storage
  5. Return quotation to frontend
  6. User can download CSV report

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
2. **Prepare Excel File**: Create an Excel file with your AWS EC2 instances (see format above)
3. **Upload File**: Click the upload area or drag and drop your Excel file
4. **Generate Quotation**: Click "Generate Quotation" button
5. **Review Results**: View the mapped Huawei Cloud instances and pricing
6. **Download Report**: Click "Download Quotation" to get a CSV file

## Pricing Information

- **Instance Pricing**: Based on Huawei Cloud list prices (hourly rates calculated to monthly)
- **Storage Pricing**: Estimated at $0.10 per GB per month
- **Currency**: USD
- **Calculation**: 730 hours per month average

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
# Test the endpoint
curl http://localhost:3000
curl -X POST http://localhost:3000/api/process -F "file=@aws_instances.xlsx"
```

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: ⏳ Ready for deployment
- **Tech Stack**: 
  - Hono (Backend framework)
  - TypeScript
  - SheetJS (xlsx) - Excel parsing
  - TailwindCSS (Frontend styling)
  - Axios (HTTP client)
- **Last Updated**: 2025-11-10

## Future Enhancements
- [ ] Add more AWS instance types (G, P, I series)
- [ ] Support for RDS, ELB, and other AWS services
- [ ] Multiple region pricing comparison
- [ ] PDF quotation export
- [ ] Historical quotation storage
- [ ] Custom pricing input
- [ ] Batch processing for multiple files
