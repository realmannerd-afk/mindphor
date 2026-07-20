const fs = require('fs');
const path = require('path');

function removeSymlinks(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    try {
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(full);
      } else if (stat.isDirectory()) {
        removeSymlinks(full);
      }
    } catch (e) {}
  }
}

function findAndCleanEs5Ext(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name === 'es5-ext') {
          removeSymlinks(path.join(dir, entry.name));
        } else if (entry.name === 'node_modules') {
          findAndCleanEs5Ext(path.join(dir, entry.name));
        } else if (!entry.name.startsWith('.')) {
          const nestedNM = path.join(dir, entry.name, 'node_modules');
          if (fs.existsSync(nestedNM)) {
            findAndCleanEs5Ext(nestedNM);
          }
        }
      }
    }
  } catch (e) {}
}

try {
  removeSymlinks('node_modules/es5-ext');
  findAndCleanEs5Ext('node_modules');
} catch (e) {}
