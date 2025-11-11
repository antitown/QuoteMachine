# Template Update - Instance Name Format

## 📋 Change Summary

The Excel template has been updated to use **Instance Names** instead of a **Count column**. Each instance now has its own row with a unique identifier.

---

## 🔄 What Changed

### Before (v2.0):
```
Instance Type | Count | Region      | OS    | Storage | Storage Type
t2.micro      | 2     | us-east-1   | Linux | 100     | SSD
c5.2xlarge    | 3     | ap-southeast-1 | Linux | 200   | SSD
```
- Used **Count** column to specify quantity
- One row could represent multiple instances
- Instances were unnamed

### After (v2.1):
```
Instance Name  | Instance Type | Region         | OS    | Storage | Storage Type
web-server-01  | t2.micro      | us-east-1      | Linux | 100     | SSD
web-server-02  | t2.micro      | us-east-1      | Linux | 100     | SSD
api-server-01  | c5.2xlarge    | ap-southeast-1 | Linux | 200     | SSD
api-server-02  | c5.2xlarge    | ap-southeast-1 | Linux | 200     | SSD
api-server-03  | c5.2xlarge    | ap-southeast-1 | Linux | 200     | SSD
```
- **Instance Name** column added as first column
- **Count** column removed
- **One row per instance** with unique name
- Better tracking and identification

---

## 📊 New Excel Format

### Required Columns

| # | Column Name | Required | Description | Example |
|---|------------|----------|-------------|---------|
| 1 | **Instance Name** | Yes | Unique identifier for the instance | web-server-01, db-primary |
| 2 | **Instance Type** | Yes | AWS EC2 instance type | t2.micro, m5.xlarge |
| 3 | Region | No | AWS region (default: us-east-1) | us-west-2, eu-west-1 |
| 4 | OS | No | Operating system (default: Linux) | Linux, Windows |
| 5 | Storage | No | Storage size in GB (default: 100) | 100, 500 |
| 6 | Storage Type | No | Storage type (default: SSD) | SSD, HDD |

### Column Name Variations

The parser is flexible and accepts these variations:

**Instance Name**:
- `Instance Name`, `InstanceName`, `instance_name`, `Name`

**Instance Type**:
- `Instance Type`, `InstanceType`, `instance_type`, `Type`

---

## 💡 Benefits of New Format

### 1. **Better Instance Tracking**
- Each instance has a unique, meaningful name
- Easier to identify specific instances in quotations
- Better for inventory management

### 2. **Clearer Quotations**
Each quotation line item includes the instance name:
```json
{
  "instanceName": "web-server-01",
  "awsInstance": "t2.micro",
  "huaweiInstance": "s6.small.1",
  "totalMonthlyPrice": 18.76
}
```

### 3. **Flexible Naming Conventions**
Use meaningful names that match your infrastructure:
- **By purpose**: `web-server-01`, `api-gateway-02`, `db-primary`
- **By environment**: `prod-web-01`, `staging-api-01`
- **By location**: `us-east-web-01`, `eu-west-db-01`
- **Custom schemes**: Any naming convention that works for you

### 4. **Better CSV Export**
Downloaded quotations now include instance names for easy reference:
```csv
Quotation ID,Instance Name,AWS Instance,Huawei Instance,...
HW-12345,web-server-01,t2.micro,s6.small.1,...
HW-12346,web-server-02,t2.micro,s6.small.1,...
```

---

## 📝 Migration Guide

### If You Have Existing Excel Files with Count Column:

**Option 1: Manual Update (Recommended)**
1. Open your existing Excel file
2. Add "Instance Name" as the first column
3. Expand rows with Count > 1 into multiple rows
4. Assign unique names to each instance
5. Remove the Count column

**Example Conversion:**
```
BEFORE:
Instance Type | Count
t2.micro      | 3

AFTER:
Instance Name  | Instance Type
web-server-01  | t2.micro
web-server-02  | t2.micro
web-server-03  | t2.micro
```

**Option 2: Use Auto-Generated Names**
- If you don't provide Instance Name column
- System will auto-generate names: `Instance-1`, `Instance-2`, etc.
- Not recommended for production use

---

## 🧪 Testing the New Format

### Test Data Included

The sample file (`AWS_Sample.xlsx`) now contains 9 instances:

```
Instance Name      AWS Type      Region            Monthly Cost
web-server-01      t2.micro      us-east-1         $18.76
web-server-02      t2.micro      us-east-1         $18.76
app-server-01      m5.xlarge     us-west-2         $190.16
api-server-01      c5.2xlarge    ap-southeast-1    $300.32
api-server-02      c5.2xlarge    ap-southeast-1    $300.32
api-server-03      c5.2xlarge    ap-southeast-1    $300.32
db-server-01       r5.large      eu-west-1         $121.98
db-server-02       r5.large      eu-west-1         $121.98
cache-server-01    m6i.2xlarge   us-east-1         $305.32

Total: 9 instances, $1,677.92/month
```

### How to Test

1. **Access the application**: https://3000-i683g7rhnhlxqak3cgrzf-2b54fc91.sandbox.novita.ai
2. **Upload AWS_Sample.xlsx** (included in project)
3. **Generate Quotation**
4. **Verify** that instance names appear in results
5. **Download CSV** to see full details with names

---

## 🎨 UI Changes

### Quotation Display

Instance names now appear prominently in quotation results:

```
┌─────────────────────────────────────────────────────────┐
│ Instance Name: web-server-01                            │
│ AWS Instance: t2.micro                                  │
│ Huawei Instance: s6.small.1                             │
│ Specs: 1 vCPU, 1GB RAM                                  │
└─────────────────────────────────────────────────────────┘
```

### Line Item Notes

Each line item includes the instance name in notes:
- Compute: `"Mapped from AWS t2.micro - web-server-01"`
- Storage: `"High-performance block storage - web-server-01"`

---

## 📚 Updated Documentation

All documentation has been updated:

- ✅ **README.md** - Updated Excel format section
- ✅ **USAGE_GUIDE.md** - Updated instructions (if applicable)
- ✅ **Sample Excel file** - New format with 9 instances
- ✅ **API responses** - Include instanceName field
- ✅ **CSV export** - Instance Name column added

---

## 🔧 Technical Details

### Data Model Changes

**EC2Instance Interface:**
```typescript
interface EC2Instance {
  instanceName: string    // NEW - unique identifier
  instanceType: string
  region: string
  os: string
  storage?: number
  storageType?: string
  // REMOVED: instanceCount
}
```

**HuaweiQuotation Interface:**
```typescript
interface HuaweiQuotation {
  quotationId: string
  generatedAt: string
  instanceName: string    // NEW - instance identifier
  awsInstance: string
  huaweiInstance: string
  // ... other fields
  // REMOVED: instanceQuantity
}
```

### API Response Format

```json
{
  "success": true,
  "quotations": [
    {
      "quotationId": "HW-1762825056411-d893f6zpj",
      "instanceName": "web-server-01",
      "awsInstance": "t2.micro",
      "huaweiInstance": "s6.small.1",
      "lineItems": [
        {
          "lineNumber": 1,
          "itemType": "compute",
          "sku": "HW-ECS-S6-SMALL-1",
          "quantity": 1,
          "notes": "Mapped from AWS t2.micro - web-server-01"
        },
        {
          "lineNumber": 2,
          "itemType": "storage",
          "sku": "HW-EVS-SSD",
          "quantity": 1,
          "notes": "High-performance block storage - web-server-01"
        }
      ]
    }
  ]
}
```

---

## ⚠️ Breaking Changes

### What's Removed:
- ❌ **Count column** - No longer supported
- ❌ **instanceCount field** - Removed from EC2Instance interface
- ❌ **instanceQuantity field** - Removed from HuaweiQuotation interface

### Backward Compatibility:
- ⚠️ **Old Excel files with Count column will not work correctly**
- ⚠️ **Each row will be treated as a single instance**
- 📝 **Migration required for existing files**

---

## ✅ Checklist for Users

- [ ] Update your Excel templates to include Instance Name column
- [ ] Remove Count column from existing files
- [ ] Expand rows with Count > 1 into separate rows
- [ ] Assign meaningful names to all instances
- [ ] Test with the new format
- [ ] Update any automation scripts that generate Excel files
- [ ] Train team members on new format

---

## 🎯 Best Practices

### Naming Conventions

**Recommended patterns:**

1. **Role-Based**:
   - `web-server-01`, `web-server-02`
   - `api-gateway-01`, `api-gateway-02`
   - `db-primary`, `db-replica-01`

2. **Environment-Prefixed**:
   - `prod-web-01`, `prod-api-01`
   - `staging-db-01`, `staging-cache-01`
   - `dev-app-01`

3. **Location-Included**:
   - `us-east-web-01`, `us-west-api-01`
   - `eu-central-db-01`

4. **Hierarchical**:
   - `prod.us-east.web.01`
   - `staging.eu-west.api.01`

**Avoid:**
- Generic names: `server1`, `server2`
- Special characters: `web@server`, `db#01`
- Very long names: `production-us-east-1-web-server-primary-master-01`

---

## 🆘 Troubleshooting

### Issue: "No valid EC2 instances found"
**Solution**: Ensure you have an "Instance Type" column with valid AWS instance types.

### Issue: Instances have generic names like "Instance-1"
**Solution**: Add an "Instance Name" column with unique names for each row.

### Issue: Getting errors with old Excel file
**Solution**: Update your Excel file to the new format (see Migration Guide above).

### Issue: Duplicate instance names
**Solution**: Ensure each instance has a unique name. The system doesn't prevent duplicates but they're recommended for clarity.

---

## 📞 Support

For questions or issues:
1. Check the updated README.md
2. Review AWS_Sample.xlsx for reference
3. Verify your Excel file format matches the new template

---

**Version**: 2.1  
**Updated**: 2025-11-11  
**Breaking Change**: Yes (Count column removed, Instance Name added)
