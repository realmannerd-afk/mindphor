const fs = require('fs');
const path = 'node_modules/@astrojs/internal-helpers/dist/fs.js';
let content = fs.readFileSync(path, 'utf8');
const regex = /await fs\.symlink\(target, dest, isDir \? "dir" : "file"\);/;
if (!regex.test(content)) {
  console.log("PATTERN NOT FOUND - printing file for manual check");
  console.log(content);
} else {
  content = content.replace(regex, 'try { await fs.symlink(target, dest, isDir ? "dir" : "file"); } catch (err) { if (err.code !== "EEXIST") throw err; }');
  fs.writeFileSync(path, content);
  console.log("Patched successfully");
  console.log(content);
}
