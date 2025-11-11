# Excel Output Format Changes

## Summary of Changes

The quotation output has been modified to provide a cleaner, more professional format with **two separate sheets** in the Excel workbook.

---

## ✅ Changes Implemented

### 1. **Removed Savings Column from Individual Line Items**

**Before**: Each line item might show individual savings
**After**: Line items only show PAYG Monthly and Subscription Monthly prices

**Columns in Detailed Sheet**:
- Quotation ID
- Instance Name
- AWS Instance
- Huawei Instance
- Line #
- Type (COMPUTE/STORAGE)
- SKU
- Description
- Specifications
- Quantity
- **PAYG Monthly (USD)** ← No savings here
- **Subscription Monthly (USD)** ← No savings here
- Region
- Notes

### 2. **Created Separate Summary Sheet**

The Excel file now contains **two sheets**:

#### **Sheet 1: "Detailed Quotation"**
Contains all line items with:
- Compute and storage items for each instance
- Instance subtotals (without savings)
- No savings calculations at line item level

#### **Sheet 2: "Summary"**
Contains high-level summary with:
- Generated date and metadata
- **Cost breakdown by type** (COMPUTE vs STORAGE)
- **Savings calculations only at the total level**
- Recommendation message

---

## 📊 Summary Sheet Structure

```
HUAWEI CLOUD QUOTATION SUMMARY

Generated Date: [timestamp]
Currency: USD
Price Source: [cached/huawei-api]

COST BREAKDOWN BY TYPE

Type          | PAYG Monthly | Subscription Monthly | Savings | Savings %
--------------|--------------|---------------------|---------|----------
COMPUTE       | $1,234.56    | $1,049.38          | $185.18 | 15.0%
STORAGE       | $300.00      | $270.00            | $30.00  | 10.0%

GRAND TOTAL   | $1,534.56    | $1,319.38          | $215.18 | 14.0%

RECOMMENDED: Monthly Subscription model saves 14.0% compared to Pay-As-You-Go
```

---

## 🔄 File Format Change

- **Before**: CSV file with mixed data and summary in one file
- **After**: Excel (.xlsx) file with two organized sheets

---

## 📋 Detailed Sheet Example

```
Quotation ID | Instance Name | AWS Instance | Huawei Instance | Line # | Type    | SKU                | Description                     | Specifications          | Qty | PAYG Monthly | Subscription Monthly | Region    | Notes
-------------|---------------|--------------|-----------------|--------|---------|--------------------|---------------------------------|------------------------|-----|--------------|---------------------|-----------|-------
HW-123...    | web-server-01 | t2.micro     | s6.small.1      | 1      | COMPUTE | HW-ECS-S6-SMALL-1 | Huawei Cloud ECS Instance...    | 1 vCPU, 1GB RAM, Linux | 1   | $8.76        | $7.45               | us-east-1 | ✓ Exact Match
HW-123...    | web-server-01 | t2.micro     | s6.small.1      | 2      | STORAGE | HW-EVS-SSD        | Huawei Cloud EVS - SSD          | 100GB SSD Block Storage| 1   | $10.00       | $9.00               | us-east-1 |
HW-123...    | web-server-01 - SUBTOTAL |  |               |        |         |                    |                                 |                        |     | $18.76       | $16.45              |           |
```

**Note**: Instance subtotals appear after each instance's line items, clearly marked with "- SUBTOTAL" suffix.

---

## 🎯 Benefits of New Format

1. **Cleaner Line Items**: No confusing savings calculations on individual items
2. **Professional Summary**: Executive-level view separated from detailed data
3. **Easy Analysis**: Type-level totals (COMPUTE vs STORAGE) clearly visible
4. **Excel Format**: Better formatting, column widths, multiple sheets
5. **Clear Savings**: Savings only shown at meaningful aggregate levels

---

## 💡 Usage

1. Upload AWS Excel file to the web application
2. Click "Generate Quotation"
3. Click "Download Quotation (Excel)" button
4. Open the downloaded `.xlsx` file
5. **Sheet 1 (Detailed Quotation)**: Review all line items
6. **Sheet 2 (Summary)**: Review cost breakdown and savings

---

## 🔧 Technical Implementation

- **Frontend**: SheetJS (xlsx.js) library via CDN
- **Sheet Creation**: `XLSX.utils.aoa_to_sheet()` for array-to-sheet conversion
- **Column Widths**: Auto-configured for readability
- **File Format**: Native Excel .xlsx format

---

## 📝 Notes

- Savings percentages are calculated as: `(PAYG - Subscription) / PAYG * 100`
- COMPUTE typically saves 15% with subscription model
- STORAGE typically saves 10% with subscription model
- Overall savings depend on the ratio of compute to storage in the quotation

---

**Last Updated**: November 11, 2025
**Implementation**: Complete and tested
