const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  // Backgrounds
  { regex: new RegExp('bg-white', 'g'), replace: 'bg-surface' },
  { regex: new RegExp('bg-gray-50', 'g'), replace: 'bg-surface' },
  { regex: new RegExp('bg-gray-100', 'g'), replace: 'bg-surface' },
  { regex: new RegExp('bg-gray-200', 'g'), replace: 'bg-surface' },
  { regex: new RegExp('bg-gray-800', 'g'), replace: 'bg-surface' },
  { regex: new RegExp('bg-gray-900', 'g'), replace: 'bg-surface' },
  { regex: new RegExp('bg-\\\\[#1A1A1A\\\\]', 'g'), replace: 'bg-surface' },
  { regex: new RegExp('bg-\\\\[#1F1B18\\\\]', 'g'), replace: 'bg-surface' },
  
  // Opacity versions
  { regex: new RegExp('bg-black/50', 'g'), replace: 'bg-text-main/50' },
  { regex: new RegExp('bg-black/60', 'g'), replace: 'bg-text-main/60' },
  
  // Texts
  { regex: new RegExp('text-black', 'g'), replace: 'text-text-main' },
  { regex: new RegExp('text-gray-900', 'g'), replace: 'text-text-main' },
  { regex: new RegExp('text-white', 'g'), replace: 'text-text-main' },
  { regex: new RegExp('text-gray-800', 'g'), replace: 'text-text-main' },
  { regex: new RegExp('text-\\\\[#1F1B18\\\\]', 'g'), replace: 'text-text-main' },
  { regex: new RegExp('text-gray-400', 'g'), replace: 'text-text-main/70' },
  { regex: new RegExp('text-gray-500', 'g'), replace: 'text-text-main/70' },
  { regex: new RegExp('text-gray-300', 'g'), replace: 'text-text-main/70' },
  { regex: new RegExp('text-gray-200', 'g'), replace: 'text-text-main/70' },
  { regex: new RegExp('text-gray-100', 'g'), replace: 'text-text-main/70' },

  // Brand colors
  { regex: new RegExp('bg-\\\\[#8C5A3C\\\\]', 'g'), replace: 'bg-text-main' },
  { regex: new RegExp('text-\\\\[#8C5A3C\\\\]', 'g'), replace: 'text-text-main' },
  { regex: new RegExp('bg-\\\\[#6B4228\\\\]', 'g'), replace: 'bg-text-main/90' },
  
  // Utang (Red)
  { regex: new RegExp('bg-red-500', 'g'), replace: 'bg-utang' },
  { regex: new RegExp('bg-red-600', 'g'), replace: 'bg-utang' },
  { regex: new RegExp('bg-red-400', 'g'), replace: 'bg-utang' },
  { regex: new RegExp('text-red-500', 'g'), replace: 'text-utang' },
  { regex: new RegExp('text-red-400', 'g'), replace: 'text-utang' },
  { regex: new RegExp('bg-red-50', 'g'), replace: 'bg-utang/10' },
  { regex: new RegExp('bg-red-100', 'g'), replace: 'bg-utang/20' },
  { regex: new RegExp('border-red-500', 'g'), replace: 'border-utang' },
  
  // Piutang (Green)
  { regex: new RegExp('bg-green-500', 'g'), replace: 'bg-piutang' },
  { regex: new RegExp('bg-green-600', 'g'), replace: 'bg-piutang' },
  { regex: new RegExp('bg-green-400', 'g'), replace: 'bg-piutang' },
  { regex: new RegExp('text-green-500', 'g'), replace: 'text-piutang' },
  { regex: new RegExp('text-green-400', 'g'), replace: 'text-piutang' },
  { regex: new RegExp('bg-green-50', 'g'), replace: 'bg-piutang/10' },
  { regex: new RegExp('border-green-500', 'g'), replace: 'border-piutang' },
  
  // Accent (Yellow/Orange)
  { regex: new RegExp('bg-yellow-500', 'g'), replace: 'bg-accent' },
  { regex: new RegExp('bg-yellow-400', 'g'), replace: 'bg-accent' },
  { regex: new RegExp('bg-orange-500', 'g'), replace: 'bg-accent' },
  { regex: new RegExp('bg-orange-400', 'g'), replace: 'bg-accent' },
  { regex: new RegExp('text-yellow-500', 'g'), replace: 'text-accent' },
  { regex: new RegExp('text-yellow-400', 'g'), replace: 'text-accent' },
  { regex: new RegExp('text-yellow-700', 'g'), replace: 'text-accent' },
  { regex: new RegExp('text-orange-500', 'g'), replace: 'text-accent' },
  { regex: new RegExp('text-orange-400', 'g'), replace: 'text-accent' },
  { regex: new RegExp('bg-yellow-50', 'g'), replace: 'bg-accent/10' },
  { regex: new RegExp('bg-orange-50', 'g'), replace: 'bg-accent/10' },
  { regex: new RegExp('border-yellow-500', 'g'), replace: 'border-accent' },
  { regex: new RegExp('border-orange-500', 'g'), replace: 'border-accent' },
  
  // Borders
  { regex: new RegExp('border-gray-100', 'g'), replace: 'border-text-main/10' },
  { regex: new RegExp('border-gray-200', 'g'), replace: 'border-text-main/10' },
  { regex: new RegExp('border-gray-300', 'g'), replace: 'border-text-main/20' },
  { regex: new RegExp('border-gray-700', 'g'), replace: 'border-text-main/20' },
  { regex: new RegExp('border-gray-800', 'g'), replace: 'border-text-main/20' },
  
  // Gradients
  { regex: new RegExp('from-gray-900', 'g'), replace: 'from-surface' },
  { regex: new RegExp('to-gray-800', 'g'), replace: 'to-background' },
  { regex: new RegExp('from-orange-500', 'g'), replace: 'from-accent' },
  { regex: new RegExp('from-orange-400', 'g'), replace: 'from-accent' },
  { regex: new RegExp('via-red-500', 'g'), replace: 'via-utang' },
  { regex: new RegExp('to-red-600', 'g'), replace: 'to-utang' },
  { regex: new RegExp('to-red-500', 'g'), replace: 'to-utang' },
  { regex: new RegExp('from-yellow-500', 'g'), replace: 'from-accent' },
  { regex: new RegExp('from-yellow-400', 'g'), replace: 'from-accent' },
  { regex: new RegExp('to-yellow-600', 'g'), replace: 'to-accent' },
  { regex: new RegExp('from-green-500', 'g'), replace: 'from-piutang' },
  { regex: new RegExp('to-transparent', 'g'), replace: 'to-transparent' }
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
console.log('Color replacement complete.');
