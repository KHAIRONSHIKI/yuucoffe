const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  { regex: /bg-\[#1F1B18\]/g, replace: 'bg-surface' },
  { regex: /text-\[#1F1B18\]/g, replace: 'text-text-main' },
  { regex: /bg-\[#1A1A1A\]/g, replace: 'bg-surface' },
  { regex: /bg-\[#F9F6F0\]/g, replace: 'bg-background' },
  { regex: /text-\[#8C5A3C\]/g, replace: 'text-text-main' },
  { regex: /bg-\[#8C5A3C\]/g, replace: 'bg-text-main' },
  { regex: /bg-\[#6B4228\]/g, replace: 'bg-text-main/90' },
  { regex: /ring-\[#8C5A3C\]/g, replace: 'ring-text-main' },
  { regex: /focus:ring-\[#8C5A3C\]/g, replace: 'focus:ring-text-main' },
  
  { regex: /text-gray-600/g, replace: 'text-text-main/70' },
  { regex: /text-gray-700/g, replace: 'text-text-main/70' },
  { regex: /bg-gray-600/g, replace: 'bg-text-main/70' },
  { regex: /bg-gray-700/g, replace: 'bg-text-main/70' },
  
  { regex: /text-green-700/g, replace: 'text-piutang' },
  { regex: /text-green-600/g, replace: 'text-piutang' },
  { regex: /bg-green-100/g, replace: 'bg-piutang/10' },
  { regex: /bg-green-200/g, replace: 'bg-piutang/20' },
  
  { regex: /text-red-700/g, replace: 'text-utang' },
  { regex: /text-red-600/g, replace: 'text-utang' },
  { regex: /bg-red-100/g, replace: 'bg-utang/10' },
  { regex: /bg-red-200/g, replace: 'bg-utang/20' },
  
  { regex: /text-blue-600/g, replace: 'text-piutang' },
  { regex: /bg-blue-100/g, replace: 'bg-piutang/10' },
  
  { regex: /text-orange-600/g, replace: 'text-accent' },
  { regex: /text-orange-700/g, replace: 'text-accent' },
  { regex: /bg-orange-100/g, replace: 'bg-accent/10' },
  { regex: /border-orange-100/g, replace: 'border-accent/10' },
  { regex: /border-orange-200/g, replace: 'border-accent/20' },
  
  { regex: /text-yellow-600/g, replace: 'text-accent' },
  { regex: /bg-yellow-100/g, replace: 'bg-accent/10' }
];

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      replacements.forEach(({ regex, replace }) => {
        content = content.replace(regex, replace);
      });
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log("Updated: " + fullPath);
      }
    }
  });
}

processDirectory(directoryPath);
console.log('Color replacement v2 complete.');
