const fs = require('fs');

const path = 'c:/projects/education/src/components/workshops/journey/AdminConsole.tsx';
let content = fs.readFileSync(path, 'utf8');

const mappings = {
  'â—‹': '○',
  'â— ': '●',
  'âœ“': '✓',
  'Â·': '·',
  'âœ¦': '✦',
  'â—†': '◆',
  'â—ˆ': '◈',
  'â ³': '⏳',
  'ï¼‹': '＋',
  'âœ•': '✕',
  'â€”': '—',
  'â€¦': '…',
  'â€': '—',
  'âœ': '✔',
  'âœ-': '✕',
  'â€œ': '“',
  'â€ ': '”',
  'â€™': "’"
};

let replacements = 0;
for (const [bad, good] of Object.entries(mappings)) {
  if (content.includes(bad)) {
    content = content.split(bad).join(good);
    replacements++;
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed ' + replacements + ' types of mojibake in AdminConsole.tsx');
