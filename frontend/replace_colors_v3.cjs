const fs = require('fs');
const path = require('path');
const directoryPath = path.join(__dirname, 'src');

const replacements = [
  { regex: /\[#8C5A3C\]/g, replace: 'text-main' },
  { regex: /\[#E5C29F\]/g, replace: 'accent' },
  { regex: /text-blue-500/g, replace: 'text-piutang' },
  { regex: /bg-blue-50/g, replace: 'bg-piutang/10' },
  { regex: /border-blue-200/g, replace: 'border-piutang/20' },
  { regex: /border-yellow-200/g, replace: 'border-accent/20' },
  { regex: /border-green-200/g, replace: 'border-piutang/20' },
  { regex: /border-orange-200/g, replace: 'border-accent/20' }
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
