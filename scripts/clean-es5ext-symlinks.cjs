const fs = require('fs');
const path = require('path');

function removeSymlinks(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    try {
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) {
        fs.rmSync(full, { recursive: true, force: true });
      } else if (stat.isDirectory()) {
        removeSymlinks(full);
      }
    } catch (e) {}
  }
}

try {
  removeSymlinks('node_modules/es5-ext');
} catch (e) {}
