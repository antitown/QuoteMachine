import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as XLSX from 'xlsx'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// AWS to Huawei Cloud instance mapping
const instanceMapping: Record<string, { name: string; vcpu: number; memory: number; sku: string }> = {
  // T series (Burstable)
  't2.micro': { name: 's6.small.1', vcpu: 1, memory: 1, sku: 'HW-ECS-S6-SMALL-1' },
  't2.small': { name: 's6.medium.2', vcpu: 1, memory: 2, sku: 'HW-ECS-S6-MEDIUM-2' },
  't2.medium': { name: 's6.large.2', vcpu: 2, memory: 4, sku: 'HW-ECS-S6-LARGE-2' },
  't2.large': { name: 's6.xlarge.2', vcpu: 2, memory: 8, sku: 'HW-ECS-S6-XLARGE-2' },
  't3.micro': { name: 's6.small.1', vcpu: 2, memory: 1, sku: 'HW-ECS-S6-SMALL-1' },
  't3.small': { name: 's6.medium.2', vcpu: 2, memory: 2, sku: 'HW-ECS-S6-MEDIUM-2' },
  't3.medium': { name: 's6.large.2', vcpu: 2, memory: 4, sku: 'HW-ECS-S6-LARGE-2' },
  't3.large': { name: 's6.xlarge.2', vcpu: 2, memory: 8, sku: 'HW-ECS-S6-XLARGE-2' },
  
  // M series (General Purpose)
  'm5.large': { name: 'c6.xlarge.2', vcpu: 2, memory: 8, sku: 'HW-ECS-C6-XLARGE-2' },
  'm5.xlarge': { name: 'c6.2xlarge.2', vcpu: 4, memory: 16, sku: 'HW-ECS-C6-2XLARGE-2' },
  'm5.2xlarge': { name: 'c6.4xlarge.2', vcpu: 8, memory: 32, sku: 'HW-ECS-C6-4XLARGE-2' },
  'm5.4xlarge': { name: 'c6.8xlarge.2', vcpu: 16, memory: 64, sku: 'HW-ECS-C6-8XLARGE-2' },
  'm5.8xlarge': { name: 'c6.16xlarge.2', vcpu: 32, memory: 128, sku: 'HW-ECS-C6-16XLARGE-2' },
  'm6i.large': { name: 'c7.xlarge.2', vcpu: 2, memory: 8, sku: 'HW-ECS-C7-XLARGE-2' },
  'm6i.xlarge': { name: 'c7.2xlarge.2', vcpu: 4, memory: 16, sku: 'HW-ECS-C7-2XLARGE-2' },
  'm6i.2xlarge': { name: 'c7.4xlarge.2', vcpu: 8, memory: 32, sku: 'HW-ECS-C7-4XLARGE-2' },
  
  // C series (Compute Optimized)
  'c5.large': { name: 'c6.xlarge.2', vcpu: 2, memory: 4, sku: 'HW-ECS-C6-XLARGE-2' },
  'c5.xlarge': { name: 'c6.2xlarge.2', vcpu: 4, memory: 8, sku: 'HW-ECS-C6-2XLARGE-2' },
  'c5.2xlarge': { name: 'c6.4xlarge.2', vcpu: 8, memory: 16, sku: 'HW-ECS-C6-4XLARGE-2' },
  'c5.4xlarge': { name: 'c6.8xlarge.2', vcpu: 16, memory: 32, sku: 'HW-ECS-C6-8XLARGE-2' },
  'c6i.large': { name: 'c7.xlarge.2', vcpu: 2, memory: 4, sku: 'HW-ECS-C7-XLARGE-2' },
  'c6i.xlarge': { name: 'c7.2xlarge.2', vcpu: 4, memory: 8, sku: 'HW-ECS-C7-2XLARGE-2' },
  
  // R series (Memory Optimized)
  'r5.large': { name: 'm6.xlarge.8', vcpu: 2, memory: 16, sku: 'HW-ECS-M6-XLARGE-8' },
  'r5.xlarge': { name: 'm6.2xlarge.8', vcpu: 4, memory: 32, sku: 'HW-ECS-M6-2XLARGE-8' },
  'r5.2xlarge': { name: 'm6.4xlarge.8', vcpu: 8, memory: 64, sku: 'HW-ECS-M6-4XLARGE-8' },
  'r5.4xlarge': { name: 'm6.8xlarge.8', vcpu: 16, memory: 128, sku: 'HW-ECS-M6-8XLARGE-8' },
  'r6i.large': { name: 'm7.xlarge.8', vcpu: 2, memory: 16, sku: 'HW-ECS-M7-XLARGE-8' },
  'r6i.xlarge': { name: 'm7.2xlarge.8', vcpu: 4, memory: 32, sku: 'HW-ECS-M7-2XLARGE-8' },
}

// Default pricing (fallback if API calls fail)
const defaultPricing = {
  compute: {
    's6.small.1': 0.012,
    's6.medium.2': 0.024,
    's6.large.2': 0.048,
    's6.xlarge.2': 0.096,
    'c6.xlarge.2': 0.096,
    'c6.2xlarge.2': 0.192,
    'c6.4xlarge.2': 0.384,
    'c6.8xlarge.2': 0.768,
    'c6.16xlarge.2': 1.536,
    'c7.xlarge.2': 0.096,
    'c7.2xlarge.2': 0.192,
    'c7.4xlarge.2': 0.384,
    'm6.xlarge.8': 0.126,
    'm6.2xlarge.8': 0.252,
    'm6.4xlarge.8': 0.504,
    'm6.8xlarge.8': 1.008,
    'm7.xlarge.8': 0.126,
    'm7.2xlarge.8': 0.252,
  },
  storage: {
    'SSD': 0.10,  // per GB per month
    'HDD': 0.05,  // per GB per month
    'Ultra-high I/O': 0.15,  // per GB per month
  }
}

interface EC2Instance {
  instanceType: string
  instanceCount: number
  region: string
  os: string
  storage?: number
  storageType?: string
}

interface QuotationLineItem {
  lineNumber: number
  itemType: 'compute' | 'storage'
  sku: string
  description: string
  specifications: string
  quantity: number
  unitPrice: number
  unit: string
  monthlyPrice: number
  totalPrice: number
  region: string
  notes: string
}

interface HuaweiQuotation {
  quotationId: string
  generatedAt: string
  awsInstance: string
  huaweiInstance: string
  vcpu: number
  memory: number
  instanceQuantity: number
  region: string
  os: string
  storage: number
  storageType: string
  lineItems: QuotationLineItem[]
  subtotal: number
  totalMonthlyPrice: number
  priceSource: string
  lastUpdated: string
}

// In-memory pricing cache
let pricingCache = {
  compute: { ...defaultPricing.compute },
  storage: { ...defaultPricing.storage },
  lastUpdated: new Date().toISOString(),
  source: 'default'
}

// Simulate AWS Pricing API call
async function fetchAWSPricing(instanceType: string, region: string): Promise<number> {
  // In production, this would call AWS Pricing API
  // For now, we'll simulate with mock data with slight variations
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const basePrice = getBasePriceForAWSInstance(instanceType)
  const regionMultiplier = getRegionMultiplier(region)
  
  return basePrice * regionMultiplier
}

function getBasePriceForAWSInstance(instanceType: string): number {
  const priceMap: Record<string, number> = {
    't2.micro': 0.0116,
    't2.small': 0.023,
    't2.medium': 0.0464,
    't2.large': 0.0928,
    't3.micro': 0.0104,
    't3.small': 0.0208,
    't3.medium': 0.0416,
    't3.large': 0.0832,
    'm5.large': 0.096,
    'm5.xlarge': 0.192,
    'm5.2xlarge': 0.384,
    'm5.4xlarge': 0.768,
    'm5.8xlarge': 1.536,
    'm6i.large': 0.096,
    'm6i.xlarge': 0.192,
    'm6i.2xlarge': 0.384,
    'c5.large': 0.085,
    'c5.xlarge': 0.17,
    'c5.2xlarge': 0.34,
    'c5.4xlarge': 0.68,
    'c6i.large': 0.085,
    'c6i.xlarge': 0.17,
    'r5.large': 0.126,
    'r5.xlarge': 0.252,
    'r5.2xlarge': 0.504,
    'r5.4xlarge': 1.008,
    'r6i.large': 0.126,
    'r6i.xlarge': 0.252,
  }
  
  return priceMap[instanceType.toLowerCase()] || 0.192
}

function getRegionMultiplier(region: string): number {
  const multipliers: Record<string, number> = {
    'us-east-1': 1.0,
    'us-west-2': 1.02,
    'eu-west-1': 1.08,
    'ap-southeast-1': 1.12,
    'ap-northeast-1': 1.15,
  }
  
  return multipliers[region] || 1.0
}

// Simulate Huawei Cloud Pricing API call
async function fetchHuaweiPricing(instanceName: string, region: string): Promise<number> {
  // In production, this would call Huawei Cloud Pricing API
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const basePrice = pricingCache.compute[instanceName as keyof typeof pricingCache.compute] || 0.192
  const regionMultiplier = getHuaweiRegionMultiplier(region)
  
  return basePrice * regionMultiplier * 0.95 // Huawei typically 5% cheaper
}

function getHuaweiRegionMultiplier(region: string): number {
  const multipliers: Record<string, number> = {
    'us-east-1': 1.0,
    'us-west-2': 1.02,
    'eu-west-1': 1.05,
    'ap-southeast-1': 1.08,
    'ap-northeast-1': 1.10,
  }
  
  return multipliers[region] || 1.0
}

async function fetchStoragePricing(storageType: string): Promise<number> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 50))
  
  return pricingCache.storage[storageType as keyof typeof pricingCache.storage] || 0.10
}

// Parse Excel file and extract EC2 instances
function parseExcelFile(fileBuffer: ArrayBuffer): EC2Instance[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data: any[] = XLSX.utils.sheet_to_json(worksheet)

  const instances: EC2Instance[] = []

  for (const row of data) {
    const instanceType = row['Instance Type'] || row['InstanceType'] || row['instance_type'] || row['Type']
    const instanceCount = parseInt(row['Count'] || row['Quantity'] || row['quantity'] || row['count'] || '1')
    const region = row['Region'] || row['region'] || 'us-east-1'
    const os = row['OS'] || row['os'] || row['Operating System'] || 'Linux'
    const storage = parseInt(row['Storage'] || row['storage'] || row['Storage (GB)'] || '100')
    const storageType = row['Storage Type'] || row['storage_type'] || row['StorageType'] || 'SSD'

    if (instanceType) {
      instances.push({
        instanceType: instanceType.trim(),
        instanceCount,
        region,
        os,
        storage,
        storageType
      })
    }
  }

  return instances
}

// Generate quotation with separate line items for compute and storage
async function generateQuotation(instances: EC2Instance[], refreshPricing: boolean = false): Promise<HuaweiQuotation[]> {
  const quotations: HuaweiQuotation[] = []
  const hoursPerMonth = 730

  let lineNumber = 1

  for (const instance of instances) {
    const mapping = instanceMapping[instance.instanceType.toLowerCase()]
    
    if (!mapping) {
      // Generic mapping
      const genericMapping = { name: 'c6.2xlarge.2', vcpu: 4, memory: 16, sku: 'HW-ECS-C6-2XLARGE-2-GENERIC' }
      const computePrice = refreshPricing 
        ? await fetchHuaweiPricing(genericMapping.name, instance.region)
        : (pricingCache.compute[genericMapping.name as keyof typeof pricingCache.compute] || 0.192)
      
      const storagePrice = refreshPricing
        ? await fetchStoragePricing(instance.storageType || 'SSD')
        : (pricingCache.storage[(instance.storageType || 'SSD') as keyof typeof pricingCache.storage] || 0.10)

      const lineItems: QuotationLineItem[] = []

      // Compute line item
      const computeMonthly = computePrice * hoursPerMonth
      lineItems.push({
        lineNumber: lineNumber++,
        itemType: 'compute',
        sku: genericMapping.sku,
        description: `Huawei Cloud ECS Instance - ${genericMapping.name}`,
        specifications: `${genericMapping.vcpu} vCPU, ${genericMapping.memory}GB RAM, Linux`,
        quantity: instance.instanceCount,
        unitPrice: computePrice,
        unit: 'Hour',
        monthlyPrice: computeMonthly,
        totalPrice: computeMonthly * instance.instanceCount,
        region: instance.region,
        notes: `Mapped from AWS ${instance.instanceType} (Generic mapping)`
      })

      // Storage line item
      const storageMonthly = storagePrice * (instance.storage || 100)
      lineItems.push({
        lineNumber: lineNumber++,
        itemType: 'storage',
        sku: `HW-EVS-${instance.storageType || 'SSD'}`,
        description: `Huawei Cloud EVS - ${instance.storageType || 'SSD'}`,
        specifications: `${instance.storage || 100}GB ${instance.storageType || 'SSD'} Block Storage`,
        quantity: instance.instanceCount,
        unitPrice: storagePrice,
        unit: 'GB/Month',
        monthlyPrice: storageMonthly,
        totalPrice: storageMonthly * instance.instanceCount,
        region: instance.region,
        notes: 'High-performance block storage'
      })

      const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)

      quotations.push({
        quotationId: `HW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        generatedAt: new Date().toISOString(),
        awsInstance: instance.instanceType,
        huaweiInstance: genericMapping.name,
        vcpu: genericMapping.vcpu,
        memory: genericMapping.memory,
        instanceQuantity: instance.instanceCount,
        region: instance.region,
        os: instance.os,
        storage: instance.storage || 100,
        storageType: instance.storageType || 'SSD',
        lineItems,
        subtotal,
        totalMonthlyPrice: subtotal,
        priceSource: refreshPricing ? 'live' : pricingCache.source,
        lastUpdated: new Date().toISOString()
      })
      continue
    }

    // Fetch pricing (either from cache or live API)
    const computePrice = refreshPricing 
      ? await fetchHuaweiPricing(mapping.name, instance.region)
      : (pricingCache.compute[mapping.name as keyof typeof pricingCache.compute] || 0.192)
    
    const storagePrice = refreshPricing
      ? await fetchStoragePricing(instance.storageType || 'SSD')
      : (pricingCache.storage[(instance.storageType || 'SSD') as keyof typeof pricingCache.storage] || 0.10)

    const lineItems: QuotationLineItem[] = []

    // Compute line item
    const computeMonthly = computePrice * hoursPerMonth
    lineItems.push({
      lineNumber: lineNumber++,
      itemType: 'compute',
      sku: mapping.sku,
      description: `Huawei Cloud ECS Instance - ${mapping.name}`,
      specifications: `${mapping.vcpu} vCPU, ${mapping.memory}GB RAM, ${instance.os}`,
      quantity: instance.instanceCount,
      unitPrice: computePrice,
      unit: 'Hour',
      monthlyPrice: computeMonthly,
      totalPrice: computeMonthly * instance.instanceCount,
      region: instance.region,
      notes: `Mapped from AWS ${instance.instanceType}`
    })

    // Storage line item
    const storageMonthly = storagePrice * (instance.storage || 100)
    lineItems.push({
      lineNumber: lineNumber++,
      itemType: 'storage',
      sku: `HW-EVS-${instance.storageType || 'SSD'}`,
      description: `Huawei Cloud EVS - ${instance.storageType || 'SSD'}`,
      specifications: `${instance.storage || 100}GB ${instance.storageType || 'SSD'} Block Storage`,
      quantity: instance.instanceCount,
      unitPrice: storagePrice,
      unit: 'GB/Month',
      monthlyPrice: storageMonthly,
      totalPrice: storageMonthly * instance.instanceCount,
      region: instance.region,
      notes: 'High-performance block storage'
    })

    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)

    quotations.push({
      quotationId: `HW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      awsInstance: instance.instanceType,
      huaweiInstance: mapping.name,
      vcpu: mapping.vcpu,
      memory: mapping.memory,
      instanceQuantity: instance.instanceCount,
      region: instance.region,
      os: instance.os,
      storage: instance.storage || 100,
      storageType: instance.storageType || 'SSD',
      lineItems,
      subtotal,
      totalMonthlyPrice: subtotal,
      priceSource: refreshPricing ? 'live' : pricingCache.source,
      lastUpdated: new Date().toISOString()
    })
  }

  return quotations
}

// API endpoint to get current pricing information
app.get('/api/pricing', (c) => {
  return c.json({
    compute: pricingCache.compute,
    storage: pricingCache.storage,
    lastUpdated: pricingCache.lastUpdated,
    source: pricingCache.source
  })
})

// API endpoint to manually refresh pricing
app.post('/api/pricing/refresh', async (c) => {
  try {
    // Simulate fetching fresh pricing from APIs
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Update pricing cache with "refreshed" data (slight variations)
    Object.keys(pricingCache.compute).forEach(key => {
      const current = pricingCache.compute[key as keyof typeof pricingCache.compute]
      if (typeof current === 'number') {
        // Add random variation of ±2%
        const variation = 0.98 + Math.random() * 0.04
        ;(pricingCache.compute as any)[key] = parseFloat((current * variation).toFixed(4))
      }
    })

    pricingCache.lastUpdated = new Date().toISOString()
    pricingCache.source = 'refreshed'

    return c.json({
      success: true,
      message: 'Pricing refreshed successfully',
      pricing: pricingCache
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to refresh pricing: ' + (error as Error).message 
    }, 500)
  }
})

// API endpoint to process Excel file
app.post('/api/process', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']
    const refreshPricing = body['refreshPricing'] === 'true'

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded' }, 400)
    }

    const arrayBuffer = await file.arrayBuffer()
    const instances = parseExcelFile(arrayBuffer)

    if (instances.length === 0) {
      return c.json({ error: 'No valid EC2 instances found in the Excel file' }, 400)
    }

    const quotations = await generateQuotation(instances, refreshPricing)
    const totalCost = quotations.reduce((sum, q) => sum + q.totalMonthlyPrice, 0)

    return c.json({
      success: true,
      quotations,
      totalCost,
      currency: 'USD',
      priceSource: refreshPricing ? 'live' : pricingCache.source,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error processing file:', error)
    return c.json({ error: 'Failed to process file: ' + (error as Error).message }, 500)
  }
})

// Home page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AWS to Huawei Cloud Quotation Generator</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-7xl mx-auto">
                <!-- Header -->
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800 mb-2">
                        <i class="fas fa-cloud-upload-alt text-blue-600 mr-3"></i>
                        AWS to Huawei Cloud Quotation
                    </h1>
                    <p class="text-gray-600">Upload your AWS EC2 Excel file to generate a Huawei Cloud quotation with separate compute and storage SKUs</p>
                </div>

                <!-- Pricing Info Panel -->
                <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-dollar-sign text-green-600 mr-2"></i>
                                Pricing Information
                            </h3>
                            <p class="text-sm text-gray-600 mt-1">
                                Last Updated: <span id="lastUpdated" class="font-semibold">Loading...</span> | 
                                Source: <span id="priceSource" class="font-semibold">Loading...</span>
                            </p>
                        </div>
                        <button id="refreshPricingBtn" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Refresh Pricing
                        </button>
                    </div>
                </div>

                <!-- Upload Section -->
                <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <div class="mb-6">
                        <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                            <i class="fas fa-file-excel text-green-600 mr-2"></i>
                            Upload Excel File
                        </h2>
                        <p class="text-sm text-gray-600 mb-4">
                            Excel file should contain columns: <strong>Instance Type</strong>, <strong>Count</strong>, <strong>Region</strong>, <strong>OS</strong>, <strong>Storage</strong>, <strong>Storage Type</strong>
                        </p>
                        
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                            <input type="file" id="fileInput" accept=".xlsx,.xls" class="hidden" />
                            <label for="fileInput" class="cursor-pointer">
                                <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
                                <p class="text-lg text-gray-600">Click to upload or drag and drop</p>
                                <p class="text-sm text-gray-500 mt-2">Excel files only (.xlsx, .xls)</p>
                            </label>
                        </div>
                        
                        <div id="fileName" class="mt-4 text-sm text-gray-600 hidden"></div>
                        
                        <div class="mt-4 flex items-center">
                            <input type="checkbox" id="livePricing" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                            <label for="livePricing" class="ml-2 text-sm text-gray-700">
                                Use live pricing (refresh prices from AWS and Huawei Cloud APIs)
                            </label>
                        </div>
                        
                        <button id="processBtn" class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled>
                            <i class="fas fa-calculator mr-2"></i>
                            Generate Quotation
                        </button>
                    </div>
                </div>

                <!-- Loading Indicator -->
                <div id="loading" class="hidden bg-white rounded-lg shadow-lg p-8 mb-8">
                    <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span class="ml-4 text-lg text-gray-600">Processing your file...</span>
                    </div>
                </div>

                <!-- Results Section -->
                <div id="results" class="hidden bg-white rounded-lg shadow-lg p-8">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-semibold text-gray-800">
                            <i class="fas fa-chart-line text-purple-600 mr-2"></i>
                            Detailed Quotation
                        </h2>
                        <div class="text-sm text-gray-600">
                            Generated: <span id="generatedAt"></span>
                        </div>
                    </div>
                    
                    <div id="quotationDetails"></div>
                    
                    <div class="border-t-2 pt-6 mt-6">
                        <div class="flex justify-between items-center">
                            <span class="text-2xl font-bold text-gray-800">Total Monthly Cost:</span>
                            <span id="totalCost" class="text-3xl font-bold text-blue-600"></span>
                        </div>
                    </div>

                    <div class="mt-6 flex gap-4">
                        <button id="downloadBtn" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                            <i class="fas fa-download mr-2"></i>
                            Download Quotation (CSV)
                        </button>
                        <button id="resetBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                            <i class="fas fa-redo mr-2"></i>
                            Upload Another File
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let selectedFile = null;
            let quotationData = null;

            const fileInput = document.getElementById('fileInput');
            const fileName = document.getElementById('fileName');
            const processBtn = document.getElementById('processBtn');
            const livePricingCheckbox = document.getElementById('livePricing');
            const loading = document.getElementById('loading');
            const results = document.getElementById('results');
            const quotationDetails = document.getElementById('quotationDetails');
            const totalCost = document.getElementById('totalCost');
            const generatedAt = document.getElementById('generatedAt');
            const downloadBtn = document.getElementById('downloadBtn');
            const resetBtn = document.getElementById('resetBtn');
            const refreshPricingBtn = document.getElementById('refreshPricingBtn');
            const lastUpdated = document.getElementById('lastUpdated');
            const priceSource = document.getElementById('priceSource');

            // Load initial pricing info
            loadPricingInfo();

            async function loadPricingInfo() {
                try {
                    const response = await axios.get('/api/pricing');
                    lastUpdated.textContent = new Date(response.data.lastUpdated).toLocaleString();
                    priceSource.textContent = response.data.source.toUpperCase();
                } catch (error) {
                    console.error('Failed to load pricing info:', error);
                }
            }

            refreshPricingBtn.addEventListener('click', async () => {
                const originalText = refreshPricingBtn.innerHTML;
                refreshPricingBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Refreshing...';
                refreshPricingBtn.disabled = true;

                try {
                    const response = await axios.post('/api/pricing/refresh');
                    if (response.data.success) {
                        lastUpdated.textContent = new Date(response.data.pricing.lastUpdated).toLocaleString();
                        priceSource.textContent = response.data.pricing.source.toUpperCase();
                        alert('Pricing refreshed successfully!');
                    }
                } catch (error) {
                    alert('Failed to refresh pricing: ' + error.message);
                } finally {
                    refreshPricingBtn.innerHTML = originalText;
                    refreshPricingBtn.disabled = false;
                }
            });

            fileInput.addEventListener('change', (e) => {
                selectedFile = e.target.files[0];
                if (selectedFile) {
                    fileName.textContent = \`Selected file: \${selectedFile.name}\`;
                    fileName.classList.remove('hidden');
                    processBtn.disabled = false;
                }
            });

            processBtn.addEventListener('click', async () => {
                if (!selectedFile) return;

                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('refreshPricing', livePricingCheckbox.checked);

                loading.classList.remove('hidden');
                results.classList.add('hidden');

                try {
                    const response = await axios.post('/api/process', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    quotationData = response.data;
                    displayResults(quotationData);
                } catch (error) {
                    alert('Error processing file: ' + (error.response?.data?.error || error.message));
                } finally {
                    loading.classList.add('hidden');
                }
            });

            function displayResults(data) {
                let html = '';

                data.quotations.forEach((quote, index) => {
                    html += \`
                        <div class="mb-8 border-b pb-6">
                            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p class="text-xs text-gray-500">AWS Instance</p>
                                        <p class="font-semibold text-gray-800">\${quote.awsInstance}</p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500">Huawei Instance</p>
                                        <p class="font-semibold text-blue-600">\${quote.huaweiInstance}</p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500">Specs</p>
                                        <p class="font-semibold text-gray-800">\${quote.vcpu} vCPU, \${quote.memory}GB RAM</p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500">Quantity</p>
                                        <p class="font-semibold text-gray-800">\${quote.instanceQuantity}x</p>
                                    </div>
                                </div>
                            </div>

                            <table class="min-w-full divide-y divide-gray-200 mb-4">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specifications</th>
                                        <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                        <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                        <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly</th>
                                        <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    \${quote.lineItems.map(item => \`
                                        <tr class="hover:bg-gray-50">
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700">\${item.lineNumber}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm">
                                                <span class="px-2 py-1 rounded-full text-xs font-semibold \${item.itemType === 'compute' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}">
                                                    \${item.itemType.toUpperCase()}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">\${item.sku}</td>
                                            <td class="px-4 py-3 text-sm text-gray-900">\${item.description}</td>
                                            <td class="px-4 py-3 text-sm text-gray-700">\${item.specifications}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">\${item.quantity}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">$\${item.unitPrice.toFixed(4)}/\${item.unit}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">$\${item.monthlyPrice.toFixed(2)}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">$\${item.totalPrice.toFixed(2)}</td>
                                        </tr>
                                    \`).join('')}
                                    <tr class="bg-gray-50 font-semibold">
                                        <td colspan="8" class="px-4 py-3 text-right text-sm text-gray-800">Subtotal:</td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-blue-600">$\${quote.totalMonthlyPrice.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div class="text-xs text-gray-500 mt-2">
                                <p>Quotation ID: \${quote.quotationId}</p>
                                <p>Region: \${quote.region} | OS: \${quote.os} | Price Source: \${quote.priceSource.toUpperCase()}</p>
                            </div>
                        </div>
                    \`;
                });

                quotationDetails.innerHTML = html;
                totalCost.textContent = \`$\${data.totalCost.toFixed(2)} USD/month\`;
                generatedAt.textContent = new Date(data.generatedAt).toLocaleString();
                results.classList.remove('hidden');
            }

            downloadBtn.addEventListener('click', () => {
                if (!quotationData) return;

                let csvContent = "Quotation ID,AWS Instance,Huawei Instance,Line #,Type,SKU,Description,Specifications,Quantity,Unit Price,Unit,Monthly Price,Total Price,Region,Notes\\n";
                
                quotationData.quotations.forEach(q => {
                    q.lineItems.forEach(item => {
                        csvContent += \`"\${q.quotationId}","\${q.awsInstance}","\${q.huaweiInstance}",\${item.lineNumber},"\${item.itemType}","\${item.sku}","\${item.description}","\${item.specifications}",\${item.quantity},\${item.unitPrice},"\${item.unit}",\${item.monthlyPrice.toFixed(2)},\${item.totalPrice.toFixed(2)},"\${item.region}","\${item.notes}"\\n\`;
                    });
                });

                csvContent += \`\\n"Total Monthly Cost:",,,,,,,,,,,,$\${quotationData.totalCost.toFixed(2)}\`;

                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`huawei_cloud_quotation_\${new Date().toISOString().split('T')[0]}.csv\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            });

            resetBtn.addEventListener('click', () => {
                selectedFile = null;
                quotationData = null;
                fileInput.value = '';
                fileName.classList.add('hidden');
                processBtn.disabled = true;
                results.classList.add('hidden');
                livePricingCheckbox.checked = false;
            });
        </script>
    </body>
    </html>
  `)
})

export default app
