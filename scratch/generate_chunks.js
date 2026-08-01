const fs = require('fs');
const content = fs.readFileSync('c:/projects/education/src/components/workshops/journey/AdminConsole.tsx', 'utf8');

// The mojibake mapping
// If UTF-8 string is read as Windows-1252 and encoded back to UTF-8:
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
  'â€¦': '…'
};

const chunks = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let changed = false;
  let originalLine = line;
  
  for (const [bad, good] of Object.entries(mappings)) {
    if (line.includes(bad)) {
      line = line.split(bad).join(good);
      changed = true;
    }
  }
  
  if (changed) {
    chunks.push({
      StartLine: i + 1,
      EndLine: i + 1,
      TargetContent: originalLine,
      ReplacementContent: line,
      AllowMultiple: true
    });
  }
}

fs.writeFileSync('c:/projects/education/scratch/fix_chunks.json', JSON.stringify(chunks, null, 2));
console.log(`Generated ${chunks.length} chunks!`);
