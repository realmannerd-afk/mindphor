const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.match(/\.(ts|tsx|astro|svelte)$/)) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Remove } else if (isGuest) { ... } completely, including the inner block.
  content = content.replace(/} else if \(isGuest\) {[\s\S]*?} else {/g, '} else {');
  
  // Dashboard index
  content = content.replace(/} else {\s*if \(isGuest\) {[\s\S]*?} else {\s*return Astro\.redirect\('\/login'\);\s*}\s*}/g, '} else {\n  return Astro.redirect(\'/login\');\n}');

  // API replacements
  content = content.replace(/if \(appId === '00000000-0000-0000-0000-000000000000'\) {[\s\S]*?}\s*else\s*{/g, '{');
  content = content.replace(/if \(body\.app_id === '00000000-0000-0000-0000-000000000000' \|\| \([\s\S]*?\}\s*else\s*\{/g, '{');

  if (content !== originalContent) {
    console.log("Modified:", file);
    fs.writeFileSync(file, content);
  }
});
