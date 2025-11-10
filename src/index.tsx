import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as XLSX from 'xlsx'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// AWS to Huawei Cloud instance mapping
const instanceMapping: Record<string, { name: string; vcpu: number; memory: number; pricePerHour: number }> = {
  // T series (Burstable)
  't2.micro': { name: 's6.small.1', vcpu: 1, memory: 1, pricePerHour: 0.012 },
  't2.small': { name: 's6.medium.2', vcpu: 1, memory: 2, pricePerHour: 0.024 },
  't2.medium': { name: 's6.large.2', vcpu: 2, memory: 4, pricePerHour: 0.048 },
  't2.large': { name: 's6.xlarge.2', vcpu: 2, memory: 8, pricePerHour: 0.096 },
  't3.micro': { name: 's6.small.1', vcpu: 2, memory: 1, pricePerHour: 0.012 },
  't3.small': { name: 's6.medium.2', vcpu: 2, memory: 2, pricePerHour: 0.024 },
  't3.medium': { name: 's6.large.2', vcpu: 2, memory: 4, pricePerHour: 0.048 },
  't3.large': { name: 's6.xlarge.2', vcpu: 2, memory: 8, pricePerHour: 0.096 },
  
  // M series (General Purpose)
  'm5.large': { name: 'c6.xlarge.2', vcpu: 2, memory: 8, pricePerHour: 0.096 },
  'm5.xlarge': { name: 'c6.2xlarge.2', vcpu: 4, memory: 16, pricePerHour: 0.192 },
  'm5.2xlarge': { name: 'c6.4xlarge.2', vcpu: 8, memory: 32, pricePerHour: 0.384 },
  'm5.4xlarge': { name: 'c6.8xlarge.2', vcpu: 16, memory: 64, pricePerHour: 0.768 },
  'm5.8xlarge': { name: 'c6.16xlarge.2', vcpu: 32, memory: 128, pricePerHour: 1.536 },
  'm6i.large': { name: 'c7.xlarge.2', vcpu: 2, memory: 8, pricePerHour: 0.096 },
  'm6i.xlarge': { name: 'c7.2xlarge.2', vcpu: 4, memory: 16, pricePerHour: 0.192 },
  'm6i.2xlarge': { name: 'c7.4xlarge.2', vcpu: 8, memory: 32, pricePerHour: 0.384 },
  
  // C series (Compute Optimized)
  'c5.large': { name: 'c6.xlarge.2', vcpu: 2, memory: 4, pricePerHour: 0.085 },
  'c5.xlarge': { name: 'c6.2xlarge.2', vcpu: 4, memory: 8, pricePerHour: 0.170 },
  'c5.2xlarge': { name: 'c6.4xlarge.2', vcpu: 8, memory: 16, pricePerHour: 0.340 },
  'c5.4xlarge': { name: 'c6.8xlarge.2', vcpu: 16, memory: 32, pricePerHour: 0.680 },
  'c6i.large': { name: 'c7.xlarge.2', vcpu: 2, memory: 4, pricePerHour: 0.085 },
  'c6i.xlarge': { name: 'c7.2xlarge.2', vcpu: 4, memory: 8, pricePerHour: 0.170 },
  
  // R series (Memory Optimized)
  'r5.large': { name: 'm6.xlarge.8', vcpu: 2, memory: 16, pricePerHour: 0.126 },
  'r5.xlarge': { name: 'm6.2xlarge.8', vcpu: 4, memory: 32, pricePerHour: 0.252 },
  'r5.2xlarge': { name: 'm6.4xlarge.8', vcpu: 8, memory: 64, pricePerHour: 0.504 },
  'r5.4xlarge': { name: 'm6.8xlarge.8', vcpu: 16, memory: 128, pricePerHour: 1.008 },
  'r6i.large': { name: 'm7.xlarge.8', vcpu: 2, memory: 16, pricePerHour: 0.126 },
  'r6i.xlarge': { name: 'm7.2xlarge.8', vcpu: 4, memory: 32, pricePerHour: 0.252 },
}

interface EC2Instance {
  instanceType: string
  instanceCount: number
  region: string
  os: string
  storage?: number
  storageType?: string
}

interface HuaweiQuotation {
  originalInstance: string
  mappedInstance: string
  vcpu: number
  memory: number
  quantity: number
  region: string
  os: string
  storage: number
  storageType: string
  pricePerHour: number
  monthlyPrice: number
  totalMonthlyPrice: number
}

// Parse Excel file and extract EC2 instances
function parseExcelFile(fileBuffer: ArrayBuffer): EC2Instance[] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data: any[] = XLSX.utils.sheet_to_json(worksheet)

  const instances: EC2Instance[] = []

  for (const row of data) {
    // Try different possible column names
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

// Map AWS instances to Huawei Cloud and generate quotation
function generateQuotation(instances: EC2Instance[]): HuaweiQuotation[] {
  const quotations: HuaweiQuotation[] = []

  for (const instance of instances) {
    const mapping = instanceMapping[instance.instanceType.toLowerCase()]
    
    if (mapping) {
      const hoursPerMonth = 730 // Average hours in a month
      const monthlyPrice = mapping.pricePerHour * hoursPerMonth
      const totalMonthlyPrice = monthlyPrice * instance.instanceCount
      
      // Add storage cost (estimated at $0.10 per GB per month)
      const storageCost = (instance.storage || 100) * 0.10 * instance.instanceCount

      quotations.push({
        originalInstance: instance.instanceType,
        mappedInstance: mapping.name,
        vcpu: mapping.vcpu,
        memory: mapping.memory,
        quantity: instance.instanceCount,
        region: instance.region,
        os: instance.os,
        storage: instance.storage || 100,
        storageType: instance.storageType || 'SSD',
        pricePerHour: mapping.pricePerHour,
        monthlyPrice: monthlyPrice,
        totalMonthlyPrice: totalMonthlyPrice + storageCost
      })
    } else {
      // If no mapping found, provide a generic recommendation
      quotations.push({
        originalInstance: instance.instanceType,
        mappedInstance: 'c6.2xlarge.2 (Generic)',
        vcpu: 4,
        memory: 16,
        quantity: instance.instanceCount,
        region: instance.region,
        os: instance.os,
        storage: instance.storage || 100,
        storageType: instance.storageType || 'SSD',
        pricePerHour: 0.192,
        monthlyPrice: 140.16,
        totalMonthlyPrice: 140.16 * instance.instanceCount + (instance.storage || 100) * 0.10 * instance.instanceCount
      })
    }
  }

  return quotations
}

// API endpoint to process Excel file
app.post('/api/process', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded' }, 400)
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Parse Excel file
    const instances = parseExcelFile(arrayBuffer)

    if (instances.length === 0) {
      return c.json({ error: 'No valid EC2 instances found in the Excel file' }, 400)
    }

    // Generate quotation
    const quotations = generateQuotation(instances)

    // Calculate total
    const totalCost = quotations.reduce((sum, q) => sum + q.totalMonthlyPrice, 0)

    return c.json({
      success: true,
      quotations,
      totalCost,
      currency: 'USD'
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
            <div class="max-w-6xl mx-auto">
                <!-- Header -->
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800 mb-2">
                        <i class="fas fa-cloud-upload-alt text-blue-600 mr-3"></i>
                        AWS to Huawei Cloud Quotation
                    </h1>
                    <p class="text-gray-600">Upload your AWS EC2 Excel file to generate a Huawei Cloud quotation</p>
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
                    <h2 class="text-2xl font-semibold text-gray-800 mb-6">
                        <i class="fas fa-chart-line text-purple-600 mr-2"></i>
                        Quotation Results
                    </h2>
                    
                    <div id="quotationTable" class="overflow-x-auto mb-6"></div>
                    
                    <div class="border-t-2 pt-6">
                        <div class="flex justify-between items-center">
                            <span class="text-2xl font-bold text-gray-800">Total Monthly Cost:</span>
                            <span id="totalCost" class="text-3xl font-bold text-blue-600"></span>
                        </div>
                    </div>

                    <div class="mt-6 flex gap-4">
                        <button id="downloadBtn" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                            <i class="fas fa-download mr-2"></i>
                            Download Quotation
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
            const loading = document.getElementById('loading');
            const results = document.getElementById('results');
            const quotationTable = document.getElementById('quotationTable');
            const totalCost = document.getElementById('totalCost');
            const downloadBtn = document.getElementById('downloadBtn');
            const resetBtn = document.getElementById('resetBtn');

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
                const table = \`
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AWS Instance</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Huawei Instance</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">vCPU</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory (GB)</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Cost</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            \${data.quotations.map(q => \`
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">\${q.originalInstance}</td>
                                    <td class="px-4 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">\${q.mappedInstance}</td>
                                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">\${q.vcpu}</td>
                                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">\${q.memory}</td>
                                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">\${q.storage}GB \${q.storageType}</td>
                                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">\${q.quantity}</td>
                                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">\${q.region}</td>
                                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">\${q.os}</td>
                                    <td class="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">$\${q.totalMonthlyPrice.toFixed(2)}</td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                \`;

                quotationTable.innerHTML = table;
                totalCost.textContent = \`$\${data.totalCost.toFixed(2)} USD/month\`;
                results.classList.remove('hidden');
            }

            downloadBtn.addEventListener('click', () => {
                if (!quotationData) return;

                let csvContent = "AWS Instance,Huawei Instance,vCPU,Memory (GB),Storage,Storage Type,Quantity,Region,OS,Price per Hour,Monthly Price,Total Monthly Price\\n";
                
                quotationData.quotations.forEach(q => {
                    csvContent += \`\${q.originalInstance},\${q.mappedInstance},\${q.vcpu},\${q.memory},\${q.storage},\${q.storageType},\${q.quantity},\${q.region},\${q.os},\${q.pricePerHour},\${q.monthlyPrice.toFixed(2)},\${q.totalMonthlyPrice.toFixed(2)}\\n\`;
                });

                csvContent += \`\\nTotal Monthly Cost:,,,,,,,,,,$\${quotationData.totalCost.toFixed(2)} USD\`;

                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'huawei_cloud_quotation.csv';
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
            });
        </script>
    </body>
    </html>
  `)
})

export default app
