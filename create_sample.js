const XLSX = require('xlsx');

// Sample data
const data = [
  {
    'Instance Type': 't2.micro',
    'Count': 2,
    'Region': 'us-east-1',
    'OS': 'Linux',
    'Storage': 100,
    'Storage Type': 'SSD'
  },
  {
    'Instance Type': 'm5.xlarge',
    'Count': 1,
    'Region': 'us-west-2',
    'OS': 'Windows',
    'Storage': 500,
    'Storage Type': 'SSD'
  },
  {
    'Instance Type': 'c5.2xlarge',
    'Count': 3,
    'Region': 'ap-southeast-1',
    'OS': 'Linux',
    'Storage': 200,
    'Storage Type': 'SSD'
  },
  {
    'Instance Type': 'r5.large',
    'Count': 2,
    'Region': 'eu-west-1',
    'OS': 'Linux',
    'Storage': 300,
    'Storage Type': 'SSD'
  },
  {
    'Instance Type': 'm6i.2xlarge',
    'Count': 1,
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
