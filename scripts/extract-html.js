const fs = require('fs');
const html = fs.readFileSync('c:/Users/vanib/Downloads/Stewardworks Environmental Literacy Redesign/Environmental Literacy.dc.html', 'utf8');
const match = html.match(/.{0,200}pillStyle.{0,200}/g);
if (match) {
  console.log(match.join('\n\n'));
} else {
  console.log('Not found');
}
