# AWS to Huawei Cloud Quotation Generator - Usage Guide

## Quick Start

### Access the Application
🌐 **Public URL**: https://3000-i683g7rhnhlxqak3cgrzf-2b54fc91.sandbox.novita.ai

### What This Application Does
This application converts AWS EC2 instance specifications to equivalent Huawei Cloud instances and generates pricing quotations. It helps with cloud migration planning and cost estimation.

## Step-by-Step Usage

### 1. Prepare Your Excel File

Your Excel file should contain AWS EC2 instance information with the following columns:

| Column Name | Required | Description | Example Values |
|------------|----------|-------------|----------------|
| Instance Type | ✅ Yes | AWS EC2 instance type | t2.micro, m5.xlarge, c5.2xlarge |
| Count | No | Number of instances (default: 1) | 1, 2, 5, 10 |
| Region | No | AWS region (default: us-east-1) | us-east-1, ap-southeast-1 |
| OS | No | Operating system (default: Linux) | Linux, Windows |
| Storage | No | Storage size in GB (default: 100) | 100, 500, 1000 |
| Storage Type | No | Type of storage (default: SSD) | SSD, HDD |

**Note**: Column names are case-insensitive and can have variations (e.g., "Instance Type", "InstanceType", "instance_type" all work)

### 2. Use the Sample File (Included)

A sample Excel file (`AWS_Sample.xlsx`) is included in the project with example data:

```
Instance Type | Count | Region         | OS      | Storage | Storage Type
t2.micro      | 2     | us-east-1      | Linux   | 100     | SSD
m5.xlarge     | 1     | us-west-2      | Windows | 500     | SSD
c5.2xlarge    | 3     | ap-southeast-1 | Linux   | 200     | SSD
r5.large      | 2     | eu-west-1      | Linux   | 300     | SSD
m6i.2xlarge   | 1     | us-east-1      | Linux   | 250     | SSD
```

You can download this file from the project directory or create your own based on this format.

### 3. Upload and Process

1. **Open the application** in your web browser
2. **Click the upload area** or drag and drop your Excel file
3. **Click "Generate Quotation"** button
4. **Wait for processing** (usually takes 1-2 seconds)
5. **Review the results** displayed in the table

### 4. Understanding the Results

The quotation table shows:

- **AWS Instance**: Your original AWS instance type
- **Huawei Instance**: Equivalent Huawei Cloud instance
- **vCPU**: Number of virtual CPUs
- **Memory (GB)**: RAM in gigabytes
- **Storage**: Storage size and type
- **Qty**: Quantity of instances
- **Region**: Cloud region
- **OS**: Operating system
- **Monthly Cost**: Total monthly cost per instance type (includes compute + storage)

### 5. Download Quotation

Click the **"Download Quotation"** button to export results as a CSV file. The CSV includes:
- All instance details
- Individual pricing
- Total monthly cost summary

### 6. Upload Another File

Click **"Upload Another File"** to start over with a new Excel file.

## Supported AWS Instance Types

### T Series (Burstable Performance)
- **t2 family**: t2.micro, t2.small, t2.medium, t2.large
- **t3 family**: t3.micro, t3.small, t3.medium, t3.large
- **Use case**: Development, testing, low-traffic applications

### M Series (General Purpose)
- **m5 family**: m5.large, m5.xlarge, m5.2xlarge, m5.4xlarge, m5.8xlarge
- **m6i family**: m6i.large, m6i.xlarge, m6i.2xlarge
- **Use case**: Balanced compute, memory, and networking

### C Series (Compute Optimized)
- **c5 family**: c5.large, c5.xlarge, c5.2xlarge, c5.4xlarge
- **c6i family**: c6i.large, c6i.xlarge
- **Use case**: High-performance computing, batch processing

### R Series (Memory Optimized)
- **r5 family**: r5.large, r5.xlarge, r5.2xlarge, r5.4xlarge
- **r6i family**: r6i.large, r6i.xlarge
- **Use case**: In-memory databases, big data processing

## Instance Mapping Examples

| AWS Instance | Huawei Instance | vCPU | Memory | Typical Use Case |
|--------------|----------------|------|---------|------------------|
| t2.micro | s6.small.1 | 1 | 1 GB | Development/Testing |
| m5.xlarge | c6.2xlarge.2 | 4 | 16 GB | Web Applications |
| c5.2xlarge | c6.4xlarge.2 | 8 | 16 GB | CPU-intensive Apps |
| r5.large | m6.xlarge.8 | 2 | 16 GB | Database Servers |

## Pricing Information

### Calculation Method
- **Compute Cost**: Based on hourly rate × 730 hours/month
- **Storage Cost**: $0.10 per GB per month
- **Total Cost**: (Compute + Storage) × Quantity

### Pricing Notes
1. Prices are **estimated** based on Huawei Cloud list prices
2. Actual prices may vary by:
   - Specific region
   - Commitment period (pay-as-you-go vs. reserved)
   - Volume discounts
   - Promotional offers
3. Storage pricing assumes standard SSD storage
4. Network egress charges not included
5. Contact Huawei Cloud sales for official quotes

## Tips for Best Results

### Excel File Preparation
✅ **Do**:
- Use clear column headers
- Include instance types exactly as AWS specifies them
- Fill in all relevant data
- Save as .xlsx or .xls format

❌ **Don't**:
- Use merged cells
- Leave Instance Type column empty
- Include special characters in column names
- Use comma as decimal separator

### Migration Planning
1. **Review mappings carefully**: Ensure Huawei instances meet your requirements
2. **Consider workload characteristics**: CPU, memory, storage needs
3. **Test performance**: Benchmark critical applications
4. **Plan for differences**: Some features may differ between clouds
5. **Factor in migration costs**: Data transfer, downtime, testing

## Troubleshooting

### Common Issues

**Problem**: "No file uploaded" error
- **Solution**: Ensure you selected a file before clicking "Generate Quotation"

**Problem**: "No valid EC2 instances found" error
- **Solution**: Check that your Excel file has an "Instance Type" column with valid AWS instance types

**Problem**: Instances show "Generic" mapping
- **Solution**: Your instance type is not in the mapping database. Review the supported instance types list

**Problem**: File won't upload
- **Solution**: Ensure file is .xlsx or .xls format and under 10MB

### Getting Help

If you encounter issues:
1. Check the browser console for error messages (F12 → Console tab)
2. Verify your Excel file matches the required format
3. Try using the included sample file first
4. Check PM2 logs: `pm2 logs webapp --nostream`

## Advanced Usage

### Creating Custom Sample Files

Use the included script to generate sample Excel files:

```bash
cd /home/user/webapp
node create_sample.cjs
```

This creates a new `AWS_Sample.xlsx` file with predefined instances.

### Modifying Instance Mappings

To add or modify instance mappings, edit the `instanceMapping` object in `src/index.tsx`:

```typescript
const instanceMapping: Record<string, { name: string; vcpu: number; memory: number; pricePerHour: number }> = {
  'your-aws-instance': { 
    name: 'huawei-instance-name', 
    vcpu: 4, 
    memory: 16, 
    pricePerHour: 0.192 
  },
  // ... more mappings
}
```

After making changes:
1. Rebuild: `npm run build`
2. Restart: `pm2 restart webapp`

### API Integration

The application exposes a REST API endpoint:

**POST /api/process**

Request:
```bash
curl -X POST https://3000-i683g7rhnhlxqak3cgrzf-2b54fc91.sandbox.novita.ai/api/process \
  -F "file=@your-file.xlsx"
```

Response:
```json
{
  "success": true,
  "quotations": [...],
  "totalCost": 1234.56,
  "currency": "USD"
}
```

## Next Steps

After generating your quotation:

1. **Review and validate** the instance mappings
2. **Download the CSV** for documentation
3. **Share with stakeholders** for approval
4. **Contact Huawei Cloud sales** for official pricing
5. **Plan your migration** timeline and strategy
6. **Test with pilot workloads** before full migration

## Support and Feedback

This is an estimation tool to help with initial planning. For production migrations:
- Consult with Huawei Cloud architects
- Conduct thorough testing
- Review security and compliance requirements
- Plan for data migration and application compatibility

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-10  
**Developed with**: Hono, TypeScript, SheetJS, TailwindCSS
