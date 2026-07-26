const fs = require('fs');

function fixIsAdmin(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/\/\s*isAdmin=(.*?)>/g, "isAdmin=$1 />");
  fs.writeFileSync(file, code);
}

fixIsAdmin('src/app/hub/pilot-workshops/JourneyClient.tsx');
fixIsAdmin('src/app/hub/pilot-workshops/[cohortId]/journey/JourneyClient.tsx');
fixIsAdmin('src/components/workshops/ai-lab/AILabClient.tsx');
