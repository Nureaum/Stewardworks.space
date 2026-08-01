const fs = require('fs');
const content = fs.readFileSync('c:/projects/education/src/components/workshops/journey/AdminConsole.tsx');
const lines = content.toString('utf8').split('\n');
console.log(lines.slice(1210, 1216).map((l, i) => `${i + 1211}: ${l}`).join('\n'));
