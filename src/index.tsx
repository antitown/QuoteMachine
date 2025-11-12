import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as XLSX from 'xlsx'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// AWS to Huawei Cloud instance mapping (mutable for editor functionality)
let instanceMapping: Record<string, { name: string; vcpu: number; memory: number; sku: string }> = {
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

// Current AWS EC2 Pricing (Updated: 2025-01-11)
// Source: AWS On-Demand Pricing Page
const awsPricingData: Record<string, number> = {
  // T series (Burstable) - US East (N. Virginia)
  't2.micro': 0.0116,
  't2.small': 0.023,
  't2.medium': 0.0464,
  't2.large': 0.0928,
  't3.micro': 0.0104,
  't3.small': 0.0208,
  't3.medium': 0.0416,
  't3.large': 0.0832,
  
  // M series (General Purpose)
  'm5.large': 0.096,
  'm5.xlarge': 0.192,
  'm5.2xlarge': 0.384,
  'm5.4xlarge': 0.768,
  'm5.8xlarge': 1.536,
  'm6i.large': 0.096,
  'm6i.xlarge': 0.192,
  'm6i.2xlarge': 0.384,
  
  // C series (Compute Optimized)
  'c5.large': 0.085,
  'c5.xlarge': 0.17,
  'c5.2xlarge': 0.34,
  'c5.4xlarge': 0.68,
  'c6i.large': 0.085,
  'c6i.xlarge': 0.17,
  
  // R series (Memory Optimized)
  'r5.large': 0.126,
  'r5.xlarge': 0.252,
  'r5.2xlarge': 0.504,
  'r5.4xlarge': 1.008,
  'r6i.large': 0.126,
  'r6i.xlarge': 0.252,
}

// Huawei Cloud API Configuration
const HUAWEI_CLOUD_CONFIG = {
  // Use environment variables for production, fallback to provided credentials for testing
  accessKey: process.env.HUAWEI_ACCESS_KEY || 'HPUAJD0HGGJTMY29QRWH',
  secretKey: process.env.HUAWEI_SECRET_KEY || 'xoCcwDv7gkk6HjKvh9BL7kbsOBHnG2Ba6UFyEco3',
  projectId: process.env.HUAWEI_PROJECT_ID || '05602429108026242f3ec01e93f02298', // Test project ID
  endpoint: 'https://bss-intl.myhuaweicloud.com',
  region: 'ap-southeast-1' // Default region
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
  instanceName: string
  instanceType: string
  region: string
  os: string
  storage?: number
  storageType?: string
}

interface PricingModel {
  payg: number           // Pay-as-you-go monthly price
  subscription: number   // Monthly subscription price (typically 15-20% discount)
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
  pricing: PricingModel
  region: string
  notes: string
}

interface HuaweiQuotation {
  quotationId: string
  generatedAt: string
  instanceName: string
  awsInstance: string
  huaweiInstance: string
  vcpu: number
  memory: number
  region: string
  os: string
  storage: number
  storageType: string
  lineItems: QuotationLineItem[]
  pricing: {
    aws: {
      compute: number
      storage: number
      total: number
    }
    payg: {
      subtotal: number
      total: number
    }
    subscription: {
      subtotal: number
      total: number
      discount: number
    }
  }
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

// Huawei Cloud flavor name to resource_spec mapping
const huaweiFlavorMapping: Record<string, string> = {
  's6.small.1': 's6.small.1.linux',
  's6.medium.2': 's6.medium.2.linux',
  's6.large.2': 's6.large.2.linux',
  's6.xlarge.2': 's6.xlarge.2.linux',
  'c6.xlarge.2': 'c6.xlarge.2.linux',
  'c6.2xlarge.2': 'c6.2xlarge.2.linux',
  'c6.4xlarge.2': 'c6.4xlarge.2.linux',
  'c6.8xlarge.2': 'c6.8xlarge.2.linux',
  'c6.16xlarge.2': 'c6.16xlarge.2.linux',
  'c7.xlarge.2': 'c7.xlarge.2.linux',
  'c7.2xlarge.2': 'c7.2xlarge.2.linux',
  'c7.4xlarge.2': 'c7.4xlarge.2.linux',
  'm6.xlarge.8': 'm6.xlarge.8.linux',
  'm6.2xlarge.8': 'm6.2xlarge.8.linux',
  'm6.4xlarge.8': 'm6.4xlarge.8.linux',
  'm6.8xlarge.8': 'm6.8xlarge.8.linux',
  'm7.xlarge.8': 'm7.xlarge.8.linux',
  'm7.2xlarge.8': 'm7.2xlarge.8.linux',
}

// Huawei region code mapping
const huaweiRegionMapping: Record<string, string> = {
  'us-east-1': 'us-east-1',
  'us-west-2': 'us-west-2',
  'eu-west-1': 'eu-west-1',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-northeast-1': 'ap-northeast-1',
}

// Get AWS Pricing from static data (updated from AWS pricing page)
function fetchAWSPricing(instanceType: string, region: string): number {
  const basePrice = awsPricingData[instanceType.toLowerCase()] || 0.192
  const regionMultiplier = getAWSRegionMultiplier(region)
  return basePrice * regionMultiplier
}

function getAWSRegionMultiplier(region: string): number {
  // AWS region price multipliers (US East baseline)
  const multipliers: Record<string, number> = {
    'us-east-1': 1.0,
    'us-west-2': 1.02,
    'eu-west-1': 1.08,
    'ap-southeast-1': 1.12,
    'ap-northeast-1': 1.15,
  }
  return multipliers[region] || 1.0
}

// Helper: SHA256 hash returning lowercase hex
async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Helper: HMAC-SHA256 returning raw bytes
async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  return new Uint8Array(signature)
}

// Helper: HMAC-SHA256 returning lowercase hex
async function hmacSha256Hex(key: Uint8Array, data: string): Promise<string> {
  const signature = await hmacSha256(key, data)
  return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Huawei Cloud API: Generate complete AK/SK signature with proper algorithm
async function generateHuaweiSignature(
  method: string,
  path: string,
  queryString: string,
  headers: Record<string, string>,
  body: string,
  timestamp: string,
  region: string = 'ap-southeast-1',
  service: string = 'bss-intl'
): Promise<{ authorization: string; signedHeaders: string }> {
  const encoder = new TextEncoder()
  
  // 1. Normalize headers to lowercase for signing
  const normalizedHeaders: Record<string, string> = {}
  Object.keys(headers).forEach(k => {
    normalizedHeaders[k.toLowerCase()] = headers[k]
  })
  
  // 2. Build canonical headers and signed headers
  const headerKeys = Object.keys(normalizedHeaders).sort()
  const canonicalHeaders = headerKeys.map(k => `${k}:${normalizedHeaders[k]}`).join('\n') + '\n'
  const signedHeaders = headerKeys.join(';')
  
  // 3. Hash the request payload
  const hashedPayload = await sha256Hex(body)
  
  // 4. Build canonical request
  const canonicalRequest = [
    method,
    path,
    queryString,
    canonicalHeaders,
    signedHeaders,
    hashedPayload
  ].join('\n')
  
  // 5. Hash the canonical request
  const hashedCanonicalRequest = await sha256Hex(canonicalRequest)
  
  // 6. Build string to sign
  const stringToSign = [
    'SDK-HMAC-SHA256',
    timestamp,
    hashedCanonicalRequest
  ].join('\n')
  
  // 7. Derive signing key (multi-step HMAC)
  const dateStr = timestamp.substring(0, 8) // YYYYMMDD
  
  const kSecret = encoder.encode('SDK' + HUAWEI_CLOUD_CONFIG.secretKey)
  const kDate = await hmacSha256(kSecret, dateStr)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, 'sdk_request')
  
  // 8. Calculate signature
  const signature = await hmacSha256Hex(kSigning, stringToSign)
  
  // 9. Build authorization header
  const authorization = `SDK-HMAC-SHA256 Access=${HUAWEI_CLOUD_CONFIG.accessKey}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  
  return { authorization, signedHeaders }
}

// Fetch Huawei Cloud ECS Pricing via API
async function fetchHuaweiPricing(instanceName: string, region: string, os: string = 'Linux'): Promise<number> {
  try {
    // Map flavor name to resource_spec
    const resourceSpec = os.toLowerCase().includes('windows')
      ? instanceName + '.win'
      : (huaweiFlavorMapping[instanceName] || instanceName + '.linux')
    
    // Map region
    const huaweiRegion = huaweiRegionMapping[region] || 'ap-southeast-1'
    
    const requestBody = {
      project_id: HUAWEI_CLOUD_CONFIG.projectId,
      product_infos: [
        {
          id: '1',
          cloud_service_type: 'hws.service.type.ec2',
          resource_type: 'hws.resource.type.vm',
          resource_spec: resourceSpec,
          region: huaweiRegion,
          usage_factor: 'Duration',
          usage_value: 1,
          usage_measure_id: 4, // 4 = hour
          subscription_num: 1
        }
      ],
      inquiry_precision: 1
    }

    const bodyString = JSON.stringify(requestBody)
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const path = '/v2/bills/ratings/on-demand-resources'
    const pathForSignature = path + '/'  // Fetch somehow adds trailing slash, so sign with it
    const host = 'bss-intl.myhuaweicloud.com'
    
    // Build headers for signing
    const headersToSign = {
      'host': host,
      'content-type': 'application/json',
      'x-sdk-date': timestamp
    }
    
    // Generate signature with proper algorithm
    const { authorization } = await generateHuaweiSignature(
      'POST',
      pathForSignature,  // Sign with trailing slash
      '',
      headersToSign,
      bodyString,
      timestamp,
      huaweiRegion,
      'bss-intl'
    )
    
    const response = await fetch(`${HUAWEI_CLOUD_CONFIG.endpoint}${path}`, {  // Fetch without trailing slash
      method: 'POST',
      headers: {
        'Host': host,
        'Content-Type': 'application/json',
        'X-Sdk-Date': timestamp,
        'Authorization': authorization
      },
      body: bodyString
    })

    if (!response.ok) {
      console.error(`Huawei Cloud API error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error(`Error details: ${errorText}`)
      // Fallback to default pricing
      return pricingCache.compute[instanceName as keyof typeof pricingCache.compute] || 0.192
    }

    const data = await response.json()
    
    if (data.product_rating_results && data.product_rating_results.length > 0) {
      // Get the hourly price from the first product result
      const hourlyPrice = parseFloat(data.product_rating_results[0].official_website_amount)
      console.log(`Huawei Cloud API price for ${instanceName}: $${hourlyPrice}/hour`)
      return hourlyPrice
    }
    
    // Fallback if no results
    return pricingCache.compute[instanceName as keyof typeof pricingCache.compute] || 0.192
  } catch (error) {
    console.error(`Error fetching Huawei pricing for ${instanceName}:`, error)
    // Fallback to cached pricing
    return pricingCache.compute[instanceName as keyof typeof pricingCache.compute] || 0.192
  }
}

// Fetch Huawei Cloud EVS storage pricing
async function fetchStoragePricing(storageType: string, storageSize: number, region: string): Promise<number> {
  try {
    // Map storage type to Huawei EVS disk type
    const diskTypeMapping: Record<string, string> = {
      'SSD': 'SSD',
      'HDD': 'SATA',
      'Ultra-high I/O': 'GPSSD'
    }
    
    const diskType = diskTypeMapping[storageType] || 'SSD'
    const huaweiRegion = huaweiRegionMapping[region] || 'ap-southeast-1'
    
    const requestBody = {
      project_id: HUAWEI_CLOUD_CONFIG.projectId,
      product_infos: [
        {
          id: '1',
          cloud_service_type: 'hws.service.type.ebs',
          resource_type: 'hws.resource.type.volume',
          resource_spec: diskType,
          region: huaweiRegion,
          usage_factor: 'Duration',
          usage_value: 1,
          usage_measure_id: 4, // 4 = hour
          subscription_num: 1,
          resource_size: storageSize,
          size_measure_id: 17 // 17 = GB
        }
      ],
      inquiry_precision: 1
    }

    const bodyString = JSON.stringify(requestBody)
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const path = '/v2/bills/ratings/on-demand-resources'
    const pathForSignature = path + '/'  // Fetch somehow adds trailing slash, so sign with it
    const host = 'bss-intl.myhuaweicloud.com'
    
    // Build headers for signing
    const headersToSign = {
      'host': host,
      'content-type': 'application/json',
      'x-sdk-date': timestamp
    }
    
    // Generate signature with proper algorithm
    const { authorization } = await generateHuaweiSignature(
      'POST',
      pathForSignature,  // Sign with trailing slash
      '',
      headersToSign,
      bodyString,
      timestamp,
      huaweiRegion,
      'bss-intl'
    )
    
    const response = await fetch(`${HUAWEI_CLOUD_CONFIG.endpoint}${path}`, {  // Fetch without trailing slash
      method: 'POST',
      headers: {
        'Host': host,
        'Content-Type': 'application/json',
        'X-Sdk-Date': timestamp,
        'Authorization': authorization
      },
      body: bodyString
    })

    if (!response.ok) {
      console.error(`Huawei Cloud Storage API error: ${response.status}`)
      return pricingCache.storage[storageType as keyof typeof pricingCache.storage] || 0.10
    }

    const data = await response.json()
    
    if (data.product_rating_results && data.product_rating_results.length > 0) {
      // Get hourly price and convert to monthly (per GB)
      const totalHourlyPrice = parseFloat(data.product_rating_results[0].official_website_amount)
      const monthlyPricePerGB = (totalHourlyPrice * 730) / storageSize
      console.log(`Huawei Cloud storage price for ${storageType}: $${monthlyPricePerGB}/GB/month`)
      return monthlyPricePerGB
    }
    
    return pricingCache.storage[storageType as keyof typeof pricingCache.storage] || 0.10
  } catch (error) {
    console.error(`Error fetching storage pricing:`, error)
    return pricingCache.storage[storageType as keyof typeof pricingCache.storage] || 0.10
  }
}

// Parse Excel file and extract EC2 instances
function parseExcelFile(fileBuffer: ArrayBuffer): EC2Instance[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data: any[] = XLSX.utils.sheet_to_json(worksheet)

  const instances: EC2Instance[] = []

  for (const row of data) {
    // First column should be Instance Name
    const instanceName = row['Instance Name'] || row['InstanceName'] || row['instance_name'] || row['Name'] || `Instance-${instances.length + 1}`
    const instanceType = row['Instance Type'] || row['InstanceType'] || row['instance_type'] || row['Type']
    const region = row['Region'] || row['region'] || 'us-east-1'
    const os = row['OS'] || row['os'] || row['Operating System'] || 'Linux'
    const storage = parseInt(row['Storage'] || row['storage'] || row['Storage (GB)'] || '100')
    const storageType = row['Storage Type'] || row['storage_type'] || row['StorageType'] || 'SSD'

    if (instanceType) {
      instances.push({
        instanceName: instanceName.toString().trim(),
        instanceType: instanceType.trim(),
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
        ? await fetchHuaweiPricing(genericMapping.name, instance.region, instance.os)
        : (pricingCache.compute[genericMapping.name as keyof typeof pricingCache.compute] || 0.192)
      
      const storagePrice = refreshPricing
        ? await fetchStoragePricing(instance.storageType || 'SSD', instance.storage || 100, instance.region)
        : (pricingCache.storage[(instance.storageType || 'SSD') as keyof typeof pricingCache.storage] || 0.10)

      const lineItems: QuotationLineItem[] = []

      // Compute line item with both pricing models
      const computeMonthlyPayg = computePrice * hoursPerMonth
      const computeMonthlySubscription = computeMonthlyPayg * 0.85 // 15% discount for subscription
      
      lineItems.push({
        lineNumber: lineNumber++,
        itemType: 'compute',
        sku: genericMapping.sku,
        description: `Huawei Cloud ECS Instance - ${genericMapping.name}`,
        specifications: `${genericMapping.vcpu} vCPU, ${genericMapping.memory}GB RAM, Linux`,
        quantity: 1,
        unitPrice: computePrice,
        unit: 'Hour',
        pricing: {
          payg: computeMonthlyPayg,
          subscription: computeMonthlySubscription
        },
        region: instance.region,
        notes: `⚠️ Best Match: Mapped from AWS ${instance.instanceType} - ${instance.instanceName} (exact mapping unavailable)`
      })

      // Storage line item with both pricing models
      const storageMonthlyPayg = storagePrice * (instance.storage || 100)
      const storageMonthlySubscription = storageMonthlyPayg * 0.90 // 10% discount for subscription
      
      lineItems.push({
        lineNumber: lineNumber++,
        itemType: 'storage',
        sku: `HW-EVS-${instance.storageType || 'SSD'}`,
        description: `Huawei Cloud EVS - ${instance.storageType || 'SSD'}`,
        specifications: `${instance.storage || 100}GB ${instance.storageType || 'SSD'} Block Storage`,
        quantity: 1,
        unitPrice: storagePrice,
        unit: 'GB/Month',
        pricing: {
          payg: storageMonthlyPayg,
          subscription: storageMonthlySubscription
        },
        region: instance.region,
        notes: `High-performance block storage - ${instance.instanceName}`
      })

      // Calculate AWS pricing
      const awsComputeHourly = awsPricingData[instance.instanceType.toLowerCase()] || 0
      const awsComputeMonthly = awsComputeHourly * hoursPerMonth
      const awsStorageMonthly = (instance.storage || 100) * 0.10 // AWS EBS GP3 pricing
      const awsTotalMonthly = awsComputeMonthly + awsStorageMonthly

      // Calculate totals for both pricing models
      const paygTotal = lineItems.reduce((sum, item) => sum + item.pricing.payg, 0)
      const subscriptionTotal = lineItems.reduce((sum, item) => sum + item.pricing.subscription, 0)
      const discount = paygTotal - subscriptionTotal

      quotations.push({
        quotationId: `HW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        generatedAt: new Date().toISOString(),
        instanceName: instance.instanceName,
        awsInstance: instance.instanceType,
        huaweiInstance: genericMapping.name,
        vcpu: genericMapping.vcpu,
        memory: genericMapping.memory,
        region: instance.region,
        os: instance.os,
        storage: instance.storage || 100,
        storageType: instance.storageType || 'SSD',
        lineItems,
        pricing: {
          aws: {
            compute: awsComputeMonthly,
            storage: awsStorageMonthly,
            total: awsTotalMonthly
          },
          payg: {
            subtotal: paygTotal,
            total: paygTotal
          },
          subscription: {
            subtotal: subscriptionTotal,
            total: subscriptionTotal,
            discount: discount
          }
        },
        priceSource: refreshPricing ? 'live' : pricingCache.source,
        lastUpdated: new Date().toISOString()
      })
      continue
    }

    // Fetch pricing (either from cache or live API)
    const computePrice = refreshPricing 
      ? await fetchHuaweiPricing(mapping.name, instance.region, instance.os)
      : (pricingCache.compute[mapping.name as keyof typeof pricingCache.compute] || 0.192)
    
    const storagePrice = refreshPricing
      ? await fetchStoragePricing(instance.storageType || 'SSD', instance.storage || 100, instance.region)
      : (pricingCache.storage[(instance.storageType || 'SSD') as keyof typeof pricingCache.storage] || 0.10)

    const lineItems: QuotationLineItem[] = []

    // Compute line item with both pricing models
    const computeMonthlyPayg = computePrice * hoursPerMonth
    const computeMonthlySubscription = computeMonthlyPayg * 0.85 // 15% discount for subscription
    
    lineItems.push({
      lineNumber: lineNumber++,
      itemType: 'compute',
      sku: mapping.sku,
      description: `Huawei Cloud ECS Instance - ${mapping.name}`,
      specifications: `${mapping.vcpu} vCPU, ${mapping.memory}GB RAM, ${instance.os}`,
      quantity: 1,
      unitPrice: computePrice,
      unit: 'Hour',
      pricing: {
        payg: computeMonthlyPayg,
        subscription: computeMonthlySubscription
      },
      region: instance.region,
      notes: `✓ Exact Match: Mapped from AWS ${instance.instanceType} - ${instance.instanceName}`
    })

    // Storage line item with both pricing models
    const storageMonthlyPayg = storagePrice * (instance.storage || 100)
    const storageMonthlySubscription = storageMonthlyPayg * 0.90 // 10% discount for subscription
    
    lineItems.push({
      lineNumber: lineNumber++,
      itemType: 'storage',
      sku: `HW-EVS-${instance.storageType || 'SSD'}`,
      description: `Huawei Cloud EVS - ${instance.storageType || 'SSD'}`,
      specifications: `${instance.storage || 100}GB ${instance.storageType || 'SSD'} Block Storage`,
      quantity: 1,
      unitPrice: storagePrice,
      unit: 'GB/Month',
      pricing: {
        payg: storageMonthlyPayg,
        subscription: storageMonthlySubscription
      },
      region: instance.region,
      notes: `High-performance block storage - ${instance.instanceName}`
    })

    // Calculate AWS pricing
    const awsComputeHourly = awsPricingData[instance.instanceType.toLowerCase()] || 0
    const awsComputeMonthly = awsComputeHourly * hoursPerMonth
    const awsStorageMonthly = (instance.storage || 100) * 0.10 // AWS EBS GP3 pricing
    const awsTotalMonthly = awsComputeMonthly + awsStorageMonthly

    // Calculate totals for both pricing models
    const paygTotal = lineItems.reduce((sum, item) => sum + item.pricing.payg, 0)
    const subscriptionTotal = lineItems.reduce((sum, item) => sum + item.pricing.subscription, 0)
    const discount = paygTotal - subscriptionTotal

    quotations.push({
      quotationId: `HW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      instanceName: instance.instanceName,
      awsInstance: instance.instanceType,
      huaweiInstance: mapping.name,
      vcpu: mapping.vcpu,
      memory: mapping.memory,
      region: instance.region,
      os: instance.os,
      storage: instance.storage || 100,
      storageType: instance.storageType || 'SSD',
      lineItems,
      pricing: {
        aws: {
          compute: awsComputeMonthly,
          storage: awsStorageMonthly,
          total: awsTotalMonthly
        },
        payg: {
          subtotal: paygTotal,
          total: paygTotal
        },
        subscription: {
          subtotal: subscriptionTotal,
          total: subscriptionTotal,
          discount: discount
        }
      },
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

// API endpoint to manually refresh pricing from Huawei Cloud API
app.post('/api/pricing/refresh', async (c) => {
  try {
    console.log('Starting pricing refresh from Huawei Cloud API...')
    
    // Fetch pricing for all Huawei instance types
    const instanceTypes = Object.keys(pricingCache.compute)
    let successCount = 0
    let failCount = 0
    
    for (const instanceType of instanceTypes) {
      try {
        const price = await fetchHuaweiPricing(instanceType, 'ap-southeast-1', 'Linux')
        if (price !== pricingCache.compute[instanceType as keyof typeof pricingCache.compute]) {
          (pricingCache.compute as any)[instanceType] = price
          successCount++
        }
      } catch (error) {
        console.error(`Failed to fetch pricing for ${instanceType}:`, error)
        failCount++
      }
    }
    
    // Fetch storage pricing
    const storageTypes = Object.keys(pricingCache.storage)
    for (const storageType of storageTypes) {
      try {
        const price = await fetchStoragePricing(storageType, 100, 'ap-southeast-1')
        if (price !== pricingCache.storage[storageType as keyof typeof pricingCache.storage]) {
          (pricingCache.storage as any)[storageType] = price
          successCount++
        }
      } catch (error) {
        console.error(`Failed to fetch storage pricing for ${storageType}:`, error)
        failCount++
      }
    }

    pricingCache.lastUpdated = new Date().toISOString()
    pricingCache.source = successCount > 0 ? 'huawei-api' : 'cached'

    console.log(`Pricing refresh complete: ${successCount} succeeded, ${failCount} failed`)

    return c.json({
      success: true,
      message: `Pricing refreshed from Huawei Cloud API`,
      stats: {
        successful: successCount,
        failed: failCount,
        total: instanceTypes.length + storageTypes.length
      },
      pricing: pricingCache
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to refresh pricing: ' + (error as Error).message 
    }, 500)
  }
})

// API endpoint to get instance mappings
app.get('/api/mappings', (c) => {
  return c.json({
    success: true,
    mappings: instanceMapping,
    count: Object.keys(instanceMapping).length
  })
})

// API endpoint to update instance mappings
app.post('/api/mappings', async (c) => {
  try {
    const body = await c.req.json()
    const { mappings } = body
    
    if (!mappings || typeof mappings !== 'object') {
      return c.json({ 
        success: false, 
        error: 'Invalid mappings data' 
      }, 400)
    }
    
    // Update the instance mapping
    instanceMapping = mappings
    
    return c.json({
      success: true,
      message: 'Instance mappings updated successfully',
      count: Object.keys(instanceMapping).length
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to update mappings: ' + (error as Error).message 
    }, 500)
  }
})

// API endpoint to add/update a single mapping
app.put('/api/mappings/:awsInstance', async (c) => {
  try {
    const awsInstance = c.req.param('awsInstance')
    const body = await c.req.json()
    const { name, vcpu, memory, sku } = body
    
    if (!name || !vcpu || !memory || !sku) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: name, vcpu, memory, sku' 
      }, 400)
    }
    
    instanceMapping[awsInstance] = { name, vcpu, memory, sku }
    
    return c.json({
      success: true,
      message: `Mapping for ${awsInstance} updated successfully`,
      mapping: instanceMapping[awsInstance]
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to update mapping: ' + (error as Error).message 
    }, 500)
  }
})

// API endpoint to delete a mapping
app.delete('/api/mappings/:awsInstance', (c) => {
  try {
    const awsInstance = c.req.param('awsInstance')
    
    if (!instanceMapping[awsInstance]) {
      return c.json({ 
        success: false, 
        error: 'Mapping not found' 
      }, 404)
    }
    
    delete instanceMapping[awsInstance]
    
    return c.json({
      success: true,
      message: `Mapping for ${awsInstance} deleted successfully`
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Failed to delete mapping: ' + (error as Error).message 
    }, 500)
  }
})

// API endpoint to get AWS pricing data
app.get('/api/aws-pricing', (c) => {
  return c.json({
    success: true,
    pricing: awsPricingData,
    count: Object.keys(awsPricingData).length
  })
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

    // Always use cached pricing for quotation generation
    // To refresh pricing, use the /api/pricing/refresh endpoint
    const quotations = await generateQuotation(instances, false)
    
    // Calculate grand totals for all pricing models
    const grandTotalAws = quotations.reduce((sum, q) => sum + q.pricing.aws.total, 0)
    const grandTotalAwsCompute = quotations.reduce((sum, q) => sum + q.pricing.aws.compute, 0)
    const grandTotalAwsStorage = quotations.reduce((sum, q) => sum + q.pricing.aws.storage, 0)
    const grandTotalPayg = quotations.reduce((sum, q) => sum + q.pricing.payg.total, 0)
    const grandTotalSubscription = quotations.reduce((sum, q) => sum + q.pricing.subscription.total, 0)
    const grandDiscount = grandTotalPayg - grandTotalSubscription

    return c.json({
      success: true,
      quotations,
      totalPricing: {
        aws: {
          compute: grandTotalAwsCompute,
          storage: grandTotalAwsStorage,
          total: grandTotalAws,
          perMonth: grandTotalAws
        },
        payg: {
          total: grandTotalPayg,
          perMonth: grandTotalPayg
        },
        subscription: {
          total: grandTotalSubscription,
          perMonth: grandTotalSubscription,
          discount: grandDiscount,
          discountPercentage: ((grandDiscount / grandTotalPayg) * 100).toFixed(1)
        }
      },
      currency: 'USD',
      priceSource: refreshPricing ? 'live' : pricingCache.source,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error processing file:', error)
    return c.json({ error: 'Failed to process file: ' + (error as Error).message }, 500)
  }
})

// API endpoint to test Huawei Cloud API integration
app.get('/api/test-huawei', async (c) => {
  try {
    const testPrice = await fetchHuaweiPricing('s6.small.1', 'ap-southeast-1', 'Linux')
    
    return c.json({
      success: true,
      message: 'Huawei Cloud API test',
      accountReference: 'APClouddemoHK',
      testInstance: 's6.small.1',
      region: 'ap-southeast-1',
      os: 'Linux',
      hourlyPrice: testPrice,
      monthlyPrice: testPrice * 730,
      config: {
        accountReference: 'APClouddemoHK',
        endpoint: HUAWEI_CLOUD_CONFIG.endpoint,
        hasAccessKey: !!HUAWEI_CLOUD_CONFIG.accessKey,
        accessKeyPrefix: HUAWEI_CLOUD_CONFIG.accessKey.substring(0, 8) + '...',
        hasSecretKey: !!HUAWEI_CLOUD_CONFIG.secretKey,
        projectId: HUAWEI_CLOUD_CONFIG.projectId,
        region: HUAWEI_CLOUD_CONFIG.region
      }
    })
  } catch (error) {
    console.error('Test error:', error)
    return c.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, 500)
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
        <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
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
                        <div class="flex gap-3">
                            <button id="refreshPricingBtn" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                <i class="fas fa-sync-alt mr-2"></i>
                                Refresh Pricing
                            </button>
                            <button id="manageMappingsBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                <i class="fas fa-edit mr-2"></i>
                                Manage Mappings
                            </button>
                        </div>
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
                            Excel file should contain columns: <strong>Instance Name</strong>, <strong>Instance Type</strong>, <strong>Region</strong>, <strong>OS</strong>, <strong>Storage</strong>, <strong>Storage Type</strong> (one row per instance)
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
                        <h3 class="text-2xl font-bold text-gray-800 mb-4">Grand Total - All Instances</h3>
                        <div id="totalCost" class="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg"></div>
                    </div>

                    <div class="mt-6 flex gap-4">
                        <button id="downloadBtn" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                            <i class="fas fa-download mr-2"></i>
                            Download Quotation (Excel)
                        </button>
                        <button id="resetBtn" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                            <i class="fas fa-redo mr-2"></i>
                            Upload Another File
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mapping Editor Modal -->
        <div id="mappingModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-edit text-blue-600 mr-2"></i>
                        AWS to Huawei Instance Mappings
                    </h2>
                    <button id="closeModalBtn" class="text-gray-600 hover:text-gray-800 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <p class="text-sm text-gray-600">
                        Edit the mappings between AWS and Huawei Cloud instance types. Changes are saved in memory and will be used for quotation generation.
                    </p>
                </div>
                
                <div class="mb-4 flex justify-end gap-3">
                    <button id="saveMappingsBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <i class="fas fa-save mr-2"></i>
                        Save Changes
                    </button>
                    <button id="reloadMappingsBtn" class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <i class="fas fa-sync-alt mr-2"></i>
                        Reload
                    </button>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border px-4 py-2 text-left">AWS Instance</th>
                                <th class="border px-4 py-2 text-left">Huawei Instance</th>
                                <th class="border px-4 py-2 text-center">vCPU</th>
                                <th class="border px-4 py-2 text-center">Memory (GB)</th>
                                <th class="border px-4 py-2 text-left">SKU</th>
                                <th class="border px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="mappingTableBody">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
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

            // Mapping Editor functionality
            const mappingModal = document.getElementById('mappingModal');
            const manageMappingsBtn = document.getElementById('manageMappingsBtn');
            const closeModalBtn = document.getElementById('closeModalBtn');
            const mappingTableBody = document.getElementById('mappingTableBody');
            const saveMappingsBtn = document.getElementById('saveMappingsBtn');
            const reloadMappingsBtn = document.getElementById('reloadMappingsBtn');
            let currentMappings = {};

            async function loadMappings() {
                try {
                    const response = await axios.get('/api/mappings');
                    currentMappings = response.data.mappings;
                    renderMappingTable();
                } catch (error) {
                    alert('Failed to load mappings: ' + error.message);
                }
            }

            function renderMappingTable() {
                mappingTableBody.innerHTML = '';
                Object.keys(currentMappings).sort().forEach(awsInstance => {
                    const mapping = currentMappings[awsInstance];
                    const row = document.createElement('tr');
                    row.innerHTML = \`
                        <td class="border px-4 py-2 font-mono">\${awsInstance}</td>
                        <td class="border px-4 py-2">
                            <input type="text" value="\${mapping.name}" 
                                   class="w-full px-2 py-1 border rounded" 
                                   data-aws="\${awsInstance}" data-field="name" />
                        </td>
                        <td class="border px-4 py-2">
                            <input type="number" value="\${mapping.vcpu}" 
                                   class="w-full px-2 py-1 border rounded text-center" 
                                   data-aws="\${awsInstance}" data-field="vcpu" />
                        </td>
                        <td class="border px-4 py-2">
                            <input type="number" value="\${mapping.memory}" 
                                   class="w-full px-2 py-1 border rounded text-center" 
                                   data-aws="\${awsInstance}" data-field="memory" />
                        </td>
                        <td class="border px-4 py-2">
                            <input type="text" value="\${mapping.sku}" 
                                   class="w-full px-2 py-1 border rounded font-mono text-sm" 
                                   data-aws="\${awsInstance}" data-field="sku" />
                        </td>
                        <td class="border px-4 py-2 text-center">
                            <button class="text-red-600 hover:text-red-800" 
                                    onclick="deleteMapping('\${awsInstance}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    \`;
                    mappingTableBody.appendChild(row);
                });

                // Add input change listeners
                document.querySelectorAll('#mappingTableBody input').forEach(input => {
                    input.addEventListener('change', (e) => {
                        const awsInstance = e.target.dataset.aws;
                        const field = e.target.dataset.field;
                        const value = field === 'vcpu' || field === 'memory' 
                            ? parseInt(e.target.value) 
                            : e.target.value;
                        currentMappings[awsInstance][field] = value;
                    });
                });
            }

            window.deleteMapping = async function(awsInstance) {
                if (confirm(\`Delete mapping for \${awsInstance}?\`)) {
                    delete currentMappings[awsInstance];
                    renderMappingTable();
                }
            };

            manageMappingsBtn.addEventListener('click', () => {
                mappingModal.classList.remove('hidden');
                loadMappings();
            });

            closeModalBtn.addEventListener('click', () => {
                mappingModal.classList.add('hidden');
            });

            saveMappingsBtn.addEventListener('click', async () => {
                try {
                    const response = await axios.post('/api/mappings', { mappings: currentMappings });
                    if (response.data.success) {
                        alert('Mappings saved successfully!');
                    }
                } catch (error) {
                    alert('Failed to save mappings: ' + error.message);
                }
            });

            reloadMappingsBtn.addEventListener('click', () => {
                loadMappings();
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
                                        <p class="text-xs text-gray-500">Instance Name</p>
                                        <p class="font-semibold text-purple-600">\${quote.instanceName}</p>
                                    </div>
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
                                        <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">PAYG/Month</th>
                                        <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subscription/Month</th>
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
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">$\${item.pricing.payg.toFixed(2)}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-700">$\${item.pricing.subscription.toFixed(2)}</td>
                                        </tr>
                                    \`).join('')}
                                    <tr class="bg-blue-50 font-semibold">
                                        <td colspan="6" class="px-4 py-3 text-right text-sm text-gray-800">Instance Total:</td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-blue-600">$\${quote.pricing.payg.total.toFixed(2)}</td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-green-600">$\${quote.pricing.subscription.total.toFixed(2)}</td>
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
                
                // Calculate totals by type
                let computePayg = 0, computeSubscription = 0;
                let storagePayg = 0, storageSubscription = 0;
                
                data.quotations.forEach(q => {
                    q.lineItems.forEach(item => {
                        if (item.itemType === 'compute') {
                            computePayg += item.pricing.payg;
                            computeSubscription += item.pricing.subscription;
                        } else if (item.itemType === 'storage') {
                            storagePayg += item.pricing.payg;
                            storageSubscription += item.pricing.subscription;
                        }
                    });
                });
                
                const computeSavings = computePayg - computeSubscription;
                const storageSavings = storagePayg - storageSubscription;
                const totalSavings = data.totalPricing.subscription.discount;
                
                // Display summary with type breakdown
                totalCost.innerHTML = \`
                    <div class="space-y-4">
                        <h3 class="text-lg font-bold text-gray-800 border-b pb-2">Cost Summary by Type</h3>
                        
                        <!-- Summary Table -->
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">PAYG Total</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subscription Total</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Savings</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr class="hover:bg-blue-50">
                                    <td class="px-4 py-3 text-sm font-semibold text-gray-900">
                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                            <i class="fas fa-server mr-1"></i> COMPUTE
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-600">$\${computePayg.toFixed(2)}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-600">$\${computeSubscription.toFixed(2)}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-700">$\${computeSavings.toFixed(2)}</td>
                                </tr>
                                <tr class="hover:bg-orange-50">
                                    <td class="px-4 py-3 text-sm font-semibold text-gray-900">
                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                            <i class="fas fa-hdd mr-1"></i> STORAGE
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-600">$\${storagePayg.toFixed(2)}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-600">$\${storageSubscription.toFixed(2)}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-700">$\${storageSavings.toFixed(2)}</td>
                                </tr>
                                <tr class="bg-gray-100 font-bold">
                                    <td class="px-4 py-3 text-sm text-gray-900">GRAND TOTAL</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-blue-700">$\${data.totalPricing.payg.total.toFixed(2)}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-green-700">$\${data.totalPricing.subscription.total.toFixed(2)}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-green-700">$\${totalSavings.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <!-- Savings Highlight -->
                        <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-sm font-semibold text-green-800">Total Savings with Monthly Subscription</p>
                                    <p class="text-xs text-green-600 mt-1">15% off compute + 10% off storage</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-2xl font-bold text-green-700">$\${totalSavings.toFixed(2)}</p>
                                    <p class="text-sm text-green-600">(\${data.totalPricing.subscription.discountPercentage}% discount)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
                
                generatedAt.textContent = new Date(data.generatedAt).toLocaleString();
                results.classList.remove('hidden');
            }

            downloadBtn.addEventListener('click', () => {
                if (!quotationData) return;

                // Calculate totals by type
                let computePayg = 0, computeSubscription = 0;
                let storagePayg = 0, storageSubscription = 0;
                
                // Sheet 1: Detailed Line Items (without savings column)
                const detailRows = [];
                detailRows.push(['Quotation ID', 'Instance Name', 'AWS Instance', 'Huawei Instance', 'Line #', 'Type', 'SKU', 'Description', 'Specifications', 'Quantity', 'PAYG Monthly (USD)', 'Subscription Monthly (USD)', 'Region', 'Notes']);
                
                quotationData.quotations.forEach(q => {
                    q.lineItems.forEach(item => {
                        detailRows.push([
                            q.quotationId,
                            q.instanceName,
                            q.awsInstance,
                            q.huaweiInstance,
                            item.lineNumber,
                            item.itemType.toUpperCase(),
                            item.sku,
                            item.description,
                            item.specifications,
                            item.quantity,
                            parseFloat(item.pricing.payg.toFixed(2)),
                            parseFloat(item.pricing.subscription.toFixed(2)),
                            item.region,
                            item.notes
                        ]);
                        
                        // Accumulate by type
                        if (item.itemType === 'compute') {
                            computePayg += item.pricing.payg;
                            computeSubscription += item.pricing.subscription;
                        } else if (item.itemType === 'storage') {
                            storagePayg += item.pricing.payg;
                            storageSubscription += item.pricing.subscription;
                        }
                    });
                    // Add instance subtotal row (without savings)
                    detailRows.push([
                        q.quotationId,
                        q.instanceName + ' - SUBTOTAL',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        parseFloat(q.pricing.payg.total.toFixed(2)),
                        parseFloat(q.pricing.subscription.total.toFixed(2)),
                        '',
                        ''
                    ]);
                    detailRows.push([]); // Empty row between instances
                });

                const computeSavings = computePayg - computeSubscription;
                const storageSavings = storagePayg - storageSubscription;
                const totalSavings = quotationData.totalPricing.subscription.discount;
                
                // Calculate AWS totals by type
                let awsComputeTotal = 0, awsStorageTotal = 0;
                quotationData.quotations.forEach(q => {
                    awsComputeTotal += q.pricing.aws.compute;
                    awsStorageTotal += q.pricing.aws.storage;
                });

                // Sheet 2: Summary Page with AWS vs Huawei pricing comparison
                const summaryRows = [];
                summaryRows.push(['AWS vs HUAWEI CLOUD PRICING COMPARISON']);
                summaryRows.push([]);
                summaryRows.push(['Generated Date:', new Date(quotationData.generatedAt).toLocaleString()]);
                summaryRows.push(['Currency:', 'USD']);
                summaryRows.push(['Price Source:', quotationData.priceSource]);
                summaryRows.push([]);
                summaryRows.push(['COST COMPARISON BY TYPE']);
                summaryRows.push([]);
                summaryRows.push(['Type', 'AWS Monthly (USD)', 'Huawei PAYG (USD)', 'Huawei Subscription (USD)', 'vs AWS Savings', 'Savings (%)']);
                summaryRows.push([
                    'COMPUTE',
                    parseFloat(awsComputeTotal.toFixed(2)),
                    parseFloat(computePayg.toFixed(2)),
                    parseFloat(computeSubscription.toFixed(2)),
                    parseFloat((awsComputeTotal - computeSubscription).toFixed(2)),
                    ((awsComputeTotal - computeSubscription) / awsComputeTotal * 100).toFixed(1) + '%'
                ]);
                summaryRows.push([
                    'STORAGE',
                    parseFloat(awsStorageTotal.toFixed(2)),
                    parseFloat(storagePayg.toFixed(2)),
                    parseFloat(storageSubscription.toFixed(2)),
                    parseFloat((awsStorageTotal - storageSubscription).toFixed(2)),
                    ((awsStorageTotal - storageSubscription) / awsStorageTotal * 100).toFixed(1) + '%'
                ]);
                summaryRows.push([]);
                summaryRows.push([
                    'GRAND TOTAL',
                    parseFloat(quotationData.totalPricing.aws.total.toFixed(2)),
                    parseFloat(quotationData.totalPricing.payg.total.toFixed(2)),
                    parseFloat(quotationData.totalPricing.subscription.total.toFixed(2)),
                    parseFloat((quotationData.totalPricing.aws.total - quotationData.totalPricing.subscription.total).toFixed(2)),
                    ((quotationData.totalPricing.aws.total - quotationData.totalPricing.subscription.total) / quotationData.totalPricing.aws.total * 100).toFixed(1) + '%'
                ]);
                summaryRows.push([]);
                summaryRows.push(['RECOMMENDATION: Huawei Cloud Subscription saves ' + ((quotationData.totalPricing.aws.total - quotationData.totalPricing.subscription.total) / quotationData.totalPricing.aws.total * 100).toFixed(1) + '% compared to AWS']);
                summaryRows.push([]);
                summaryRows.push(['INTERNAL HUAWEI SAVINGS']);
                summaryRows.push(['Type', 'PAYG Monthly (USD)', 'Subscription Monthly (USD)', 'Savings (USD)', 'Savings (%)']);
                summaryRows.push([
                    'COMPUTE',
                    parseFloat(computePayg.toFixed(2)),
                    parseFloat(computeSubscription.toFixed(2)),
                    parseFloat(computeSavings.toFixed(2)),
                    ((computeSavings / computePayg) * 100).toFixed(1) + '%'
                ]);
                summaryRows.push([
                    'STORAGE',
                    parseFloat(storagePayg.toFixed(2)),
                    parseFloat(storageSubscription.toFixed(2)),
                    parseFloat(storageSavings.toFixed(2)),
                    ((storageSavings / storagePayg) * 100).toFixed(1) + '%'
                ]);
                summaryRows.push([
                    'TOTAL',
                    parseFloat(quotationData.totalPricing.payg.total.toFixed(2)),
                    parseFloat(quotationData.totalPricing.subscription.total.toFixed(2)),
                    parseFloat(totalSavings.toFixed(2)),
                    quotationData.totalPricing.subscription.discountPercentage + '%'
                ]);

                // Create workbook with two sheets
                const wb = XLSX.utils.book_new();
                const ws1 = XLSX.utils.aoa_to_sheet(detailRows);
                const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
                
                // Set column widths for better readability
                ws1['!cols'] = [
                    {wch: 20}, // Quotation ID
                    {wch: 20}, // Instance Name
                    {wch: 15}, // AWS Instance
                    {wch: 15}, // Huawei Instance
                    {wch: 8},  // Line #
                    {wch: 10}, // Type
                    {wch: 20}, // SKU
                    {wch: 35}, // Description
                    {wch: 25}, // Specifications
                    {wch: 10}, // Quantity
                    {wch: 18}, // PAYG Monthly
                    {wch: 22}, // Subscription Monthly
                    {wch: 15}, // Region
                    {wch: 50}  // Notes
                ];
                
                ws2['!cols'] = [
                    {wch: 20}, // Type/Label
                    {wch: 20}, // AWS Monthly
                    {wch: 22}, // Huawei PAYG
                    {wch: 25}, // Huawei Subscription
                    {wch: 18}, // vs AWS Savings
                    {wch: 15}  // Savings %
                ];
                
                XLSX.utils.book_append_sheet(wb, ws1, 'Detailed Quotation');
                XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
                
                // Generate Excel file
                XLSX.writeFile(wb, \`huawei_cloud_quotation_\${new Date().toISOString().split('T')[0]}.xlsx\`);
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
