const fs = require('fs');
const { execSync } = require('child_process');

const current = fs.readFileSync('c:/projects/education/src/components/workshops/journey/AdminConsole.tsx', 'utf8');

// Get the original content from git
const originalRaw = execSync('git show HEAD:src/components/workshops/journey/AdminConsole.tsx', { encoding: 'utf8' });

// We will find non-ascii characters in original and see how they map to current.
// But a simpler approach is: we know we only want to fix the symbols.
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
  'â€': '—', // wait, â€” is em-dash, what is â€?
  'âœ': '✔',
  'âœ-': '✕', // wait, maybe?
  'â€œ': '“',
  'â€ ': '”',
  'â€™': "’"
};

// Instead of manual mappings, let's just use iconv-lite if installed, or fallback to manual.
const chunks = [];
const lines = current.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let changed = false;
  let originalLine = line;
  
  // replace all bad sequences
  for (const [bad, good] of Object.entries(mappings)) {
    if (line.includes(bad)) {
      line = line.split(bad).join(good);
      changed = true;
    }
  }
  
  // if still has strange chars, we might want to log it
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

fs.writeFileSync('c:/projects/education/scratch/chunks2.json', JSON.stringify(chunks, null, 2));
console.log('Created ' + chunks.length + ' chunks.');
