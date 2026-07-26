const fs = require('fs');

function addIsAdmin(file, propValue) {
  let code = fs.readFileSync(file, 'utf8');
  let regex = /(<Showcase\b[^>]*?)(>)/g;
  code = code.replace(regex, (match, p1, p2) => {
    if (p1.includes('isAdmin=')) return match;
    let space = p1.match(/\s$/) ? '' : ' ';
    return p1 + space + `isAdmin={${propValue}}` + p2;
  });
  fs.writeFileSync(file, code);
}

addIsAdmin('src/app/hub/pilot-workshops/JourneyClient.tsx', "role === 'admin' || role === 'super_admin'");
addIsAdmin('src/app/hub/pilot-workshops/[cohortId]/journey/JourneyClient.tsx', "isAdmin");
addIsAdmin('src/components/workshops/ai-lab/AILabClient.tsx', "userRole === 'admin' || userRole === 'super_admin'");
