const XLSX = require('xlsx');

// Sample data - one row per instance with unique names
const data = [
  {
    'Instance Name': 'web-server-01',
    'Instance Type': 't2.micro',
    'Region': 'us-east-1',
    'OS': 'Linux',
    'Storage': 100,
    'Storage Type': 'SSD'
  },
  {
    'Instance Name': 'web-server-02',
    'Instance Type': 't2.micro',
    'Region': 'us-east-1',
    'OS': 'Linux',
    'Storage': 100,
    'Storage Type': 'SSD'
  },
  {
    'Instance Name': 'app-server-01',
    'Instance Type': 'm5.xlarge',
    'Region': 'us-west-2',
    'OS': 'Windows',
    'Storage': 500,
    'Storage Type': 'SSD'
  },
  {
    'Instance Name': 'api-server-01',
    'Instance Type': 'c5.2xlarge',
    'Region': 'ap-southeast-1',
    'OS': 'Linux',
    'Storage': 200,
    'Storage Type': 'SSD'
  },
  {
    'Instance Name': 'api-server-02',
    'Instance Type': 'c5.2xlarge',
    'Region': 'ap-southeast-1',
    'OS': 'Linux',
    'Storage': 200,
    'Storage Type': 'SSD'
  },
  {
    'Instance Name': 'api-server-03',
    'Instance Type': 'c5.2xlarge',
    'Region': 'ap-southeast-1',
    'OS': 'Linux',
    'Storage': 200,
    'Storage Type': 'SSD'
  },
  {
    'Instance Name': 'db-server-01',
    'Instance Type': 'r5.large',
    'Region': 'eu-west-1',
    'OS': 'Linux',
    'Storage': 300,
    'Storage Type': 'SSD'
  },
  {
    'Instance Name': 'db-server-02',
    'Instance Type': 'r5.large',
    'Region': 'eu-west-1',
    'OS': 'Linux',
    'Storage': 300,
    'Storage Type': 'SSD'
  },
  {
    'Instance Name': 'cache-server-01',
    'Instance Type': 'm6i.2xlarge',
    'Region': 'us-east-1',
    'OS': 'Linux',
    'Storage': 250,
    'Storage Type': 'SSD'
  }
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'AWS EC2 Instances');

// Write to file
XLSX.writeFile(wb, 'AWS_Sample.xlsx');

console.log('Sample Excel file created: AWS_Sample.xlsx');
console.log('Total instances:', data.length);
