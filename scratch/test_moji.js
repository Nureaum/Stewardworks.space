const fs = require('fs');

const s = "âœ“";
const b = Buffer.from(s, 'latin1');
console.log(b.toString('utf8'));
