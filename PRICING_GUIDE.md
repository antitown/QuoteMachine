# Pricing and SKU Guide

## Overview

The AWS to Huawei Cloud Quotation Generator now features **separated compute and storage SKUs** with **manual pricing refresh** capabilities. This guide explains how pricing works and how to interpret the quotation results.

## Pricing Architecture

### Two-Tier SKU System

Each AWS EC2 instance is mapped to **two separate Huawei Cloud SKUs**:

1. **Compute SKU** (ECS - Elastic Cloud Server)
   - Covers CPU, memory, and OS
   - Priced per hour
   - SKU format: `HW-ECS-{SERIES}-{SIZE}`

2. **Storage SKU** (EVS - Elastic Volume Service)
   - Covers block storage volumes
   - Priced per GB per month
   - SKU format: `HW-EVS-{TYPE}`

### Example Breakdown

**AWS Instance**: m5.xlarge with 500GB SSD storage

**Huawei Cloud Quotation**:
```
Line 1: HW-ECS-C6-2XLARGE-2
  - 4 vCPU, 16GB RAM, Linux
  - $0.192/hour
  - $140.16/month (730 hours)

Line 2: HW-EVS-SSD
  - 500GB SSD Block Storage
  - $0.10/GB/month
  - $50.00/month (500 GB)

Total: $190.16/month
```

## SKU Reference Guide

### Compute SKUs (HW-ECS-*)

#### General Purpose (C6/C7 Series)
| SKU | Huawei Instance | vCPU | Memory | Hourly Price | Monthly Price |
|-----|----------------|------|---------|--------------|---------------|
| HW-ECS-C6-XLARGE-2 | c6.xlarge.2 | 2 | 8 GB | $0.096 | $70.08 |
| HW-ECS-C6-2XLARGE-2 | c6.2xlarge.2 | 4 | 16 GB | $0.192 | $140.16 |
| HW-ECS-C6-4XLARGE-2 | c6.4xlarge.2 | 8 | 32 GB | $0.384 | $280.32 |
| HW-ECS-C6-8XLARGE-2 | c6.8xlarge.2 | 16 | 64 GB | $0.768 | $560.64 |
| HW-ECS-C6-16XLARGE-2 | c6.16xlarge.2 | 32 | 128 GB | $1.536 | $1,121.28 |

#### Memory Optimized (M6/M7 Series)
| SKU | Huawei Instance | vCPU | Memory | Hourly Price | Monthly Price |
|-----|----------------|------|---------|--------------|---------------|
| HW-ECS-M6-XLARGE-8 | m6.xlarge.8 | 2 | 16 GB | $0.126 | $91.98 |
| HW-ECS-M6-2XLARGE-8 | m6.2xlarge.8 | 4 | 32 GB | $0.252 | $183.96 |
| HW-ECS-M6-4XLARGE-8 | m6.4xlarge.8 | 8 | 64 GB | $0.504 | $367.92 |
| HW-ECS-M6-8XLARGE-8 | m6.8xlarge.8 | 16 | 128 GB | $1.008 | $735.84 |

#### Burstable (S6 Series)
| SKU | Huawei Instance | vCPU | Memory | Hourly Price | Monthly Price |
|-----|----------------|------|---------|--------------|---------------|
| HW-ECS-S6-SMALL-1 | s6.small.1 | 1 | 1 GB | $0.012 | $8.76 |
| HW-ECS-S6-MEDIUM-2 | s6.medium.2 | 1 | 2 GB | $0.024 | $17.52 |
| HW-ECS-S6-LARGE-2 | s6.large.2 | 2 | 4 GB | $0.048 | $35.04 |
| HW-ECS-S6-XLARGE-2 | s6.xlarge.2 | 2 | 8 GB | $0.096 | $70.08 |

### Storage SKUs (HW-EVS-*)

| SKU | Storage Type | Price per GB/month | Performance | Use Case |
|-----|-------------|-------------------|-------------|----------|
| HW-EVS-SSD | SSD | $0.10 | High IOPS (1000+) | General purpose, databases |
| HW-EVS-HDD | HDD | $0.05 | Standard IOPS (100-200) | Backups, archives |
| HW-EVS-ULTRA | Ultra-high I/O | $0.15 | Very high IOPS (10000+) | High-performance databases |

## Pricing Sources

### Cached Pricing (Default)
- **Speed**: Instant (no API calls)
- **Freshness**: Last refreshed timestamp
- **Use case**: Quick estimates, multiple quotations
- **Source**: In-memory cache

### Live Pricing (Optional)
- **Speed**: 1-2 seconds (API calls)
- **Freshness**: Real-time from APIs
- **Use case**: Final quotes, official proposals
- **Source**: AWS and Huawei Cloud Pricing APIs

### Manual Refresh
- **Button**: "Refresh Pricing" in UI
- **Effect**: Updates cached prices with latest from APIs
- **Frequency**: Use before important quotations
- **Variation**: Prices may vary ±2% based on market conditions

## Regional Price Multipliers

Prices vary by cloud region:

| Region | Code | Multiplier | Example Impact |
|--------|------|------------|----------------|
| US East (N. Virginia) | us-east-1 | 1.00× | Base price |
| US West (Oregon) | us-west-2 | 1.02× | +2% |
| EU (Ireland) | eu-west-1 | 1.08× | +8% |
| Asia Pacific (Singapore) | ap-southeast-1 | 1.12× | +12% |
| Asia Pacific (Tokyo) | ap-northeast-1 | 1.15× | +15% |

**Example**: 
- c6.2xlarge.2 base price: $0.192/hour
- In ap-southeast-1: $0.192 × 1.12 = $0.215/hour

## Quotation Line Items

### Understanding the Quotation Table

Each quotation contains multiple line items:

| Column | Description | Example |
|--------|-------------|---------|
| # | Line number | 1, 2, 3... |
| Type | COMPUTE or STORAGE | COMPUTE |
| SKU | Huawei Cloud SKU code | HW-ECS-C6-2XLARGE-2 |
| Description | Service description | Huawei Cloud ECS Instance - c6.2xlarge.2 |
| Specifications | Technical specs | 4 vCPU, 16GB RAM, Linux |
| Qty | Number of instances | 2 |
| Unit Price | Price per unit | $0.192/Hour |
| Monthly | Monthly price per unit | $140.16 |
| Total | Total monthly cost | $280.32 |

### Sample Complete Quotation

**Input**: 2× m5.xlarge instances, us-east-1, Linux, 500GB SSD each

**Output**:

```
Quotation ID: HW-1699123456-abc123xyz

Line 1: COMPUTE
  SKU: HW-ECS-C6-2XLARGE-2
  Description: Huawei Cloud ECS Instance - c6.2xlarge.2
  Specifications: 4 vCPU, 16GB RAM, Linux
  Quantity: 2
  Unit Price: $0.192/Hour
  Monthly: $140.16
  Total: $280.32

Line 2: STORAGE
  SKU: HW-EVS-SSD
  Description: Huawei Cloud EVS - SSD
  Specifications: 500GB SSD Block Storage
  Quantity: 2
  Unit Price: $0.10/GB/Month
  Monthly: $50.00
  Total: $100.00

Subtotal: $380.32/month
```

## Cost Comparison

### AWS vs Huawei Cloud

Huawei Cloud typically offers **5-10% savings** compared to AWS:

| AWS Instance | AWS Monthly Cost | Huawei Monthly Cost | Savings |
|-------------|------------------|---------------------|---------|
| t2.micro | $8.50 | $8.76 | -3% (premium) |
| m5.xlarge | $140.16 | $140.16 | 0% (equivalent) |
| c5.2xlarge | $248.20 | $248.20 | 0% (equivalent) |
| r5.large | $91.98 | $91.98 | 0% (equivalent) |

**Note**: Actual savings depend on:
- Region selection
- Commitment period (pay-as-you-go vs. reserved)
- Volume discounts
- Special enterprise agreements

## How to Use Pricing Features

### Step 1: Refresh Pricing (Recommended)

Before generating quotations:

1. Click **"Refresh Pricing"** button in the UI
2. Wait for confirmation (1-2 seconds)
3. Verify "Last Updated" timestamp is current
4. Check "Source" shows "REFRESHED"

### Step 2: Choose Pricing Mode

When uploading Excel file:

**Option A: Cached Pricing (Fast)**
- Leave "Use live pricing" unchecked
- Uses last refreshed prices from cache
- Instant results
- Good for: Multiple quotations, quick estimates

**Option B: Live Pricing (Accurate)**
- Check "Use live pricing" checkbox
- Fetches real-time prices from APIs
- 1-2 second delay per instance
- Good for: Final quotes, official proposals

### Step 3: Review Pricing Source

In quotation results:
- Check "Price Source" field
- Values: DEFAULT, REFRESHED, or LIVE
- Verify timestamp is recent

### Step 4: Download Detailed CSV

CSV export includes:
- All line items with SKU codes
- Individual and total pricing
- Specifications and notes
- Quotation ID for reference

## API Integration

### Get Current Pricing

```bash
curl http://localhost:3000/api/pricing
```

**Response**:
```json
{
  "compute": {
    "c6.xlarge.2": 0.096,
    "c6.2xlarge.2": 0.192,
    ...
  },
  "storage": {
    "SSD": 0.10,
    "HDD": 0.05
  },
  "lastUpdated": "2025-11-10T13:58:31.519Z",
  "source": "refreshed"
}
```

### Refresh Pricing

```bash
curl -X POST http://localhost:3000/api/pricing/refresh
```

**Response**:
```json
{
  "success": true,
  "message": "Pricing refreshed successfully",
  "pricing": {
    "compute": {...},
    "storage": {...},
    "lastUpdated": "2025-11-10T14:00:00.000Z",
    "source": "refreshed"
  }
}
```

### Generate Quotation with Pricing Options

**With cached pricing**:
```bash
curl -X POST http://localhost:3000/api/process \
  -F "file=@aws_instances.xlsx" \
  -F "refreshPricing=false"
```

**With live pricing**:
```bash
curl -X POST http://localhost:3000/api/process \
  -F "file=@aws_instances.xlsx" \
  -F "refreshPricing=true"
```

## Best Practices

### For Quick Estimates
1. Use cached pricing (uncheck live pricing)
2. Process multiple files without refreshing
3. Review aggregated costs

### For Official Quotations
1. Click "Refresh Pricing" before starting
2. Enable "Use live pricing" checkbox
3. Generate quotation with current prices
4. Download CSV with full details
5. Include quotation ID in proposal

### For Large Migrations
1. Refresh pricing at start of planning session
2. Use cached pricing for bulk processing
3. Re-refresh before finalizing recommendations
4. Compare pricing across multiple regions

## Pricing Notes and Disclaimers

⚠️ **Important Notes**:

1. **Simulated APIs**: Current version simulates AWS and Huawei Cloud pricing APIs with realistic variations
2. **Production Use**: For production deployment, integrate real pricing APIs
3. **Official Quotes**: Contact Huawei Cloud sales for official pricing quotes
4. **Regional Variations**: Actual prices vary by region, commitment, and volume
5. **Network Costs**: Network egress and data transfer costs not included
6. **Support Costs**: Enterprise support plans priced separately
7. **Discounts**: Volume, commitment, and promotional discounts not reflected

## Support

For questions about pricing:
- Review official Huawei Cloud pricing at: https://www.huaweicloud.com/intl/en-us/pricing.html
- Contact Huawei Cloud sales for enterprise quotes
- Refer to quotation ID when requesting support

---

**Version**: 2.0  
**Last Updated**: 2025-11-10  
**Pricing Currency**: USD  
**Standard Calculation**: 730 hours/month for compute
