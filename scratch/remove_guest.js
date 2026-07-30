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

  // 1. Remove mockReviewCache imports
  content = content.replace(/const { getMockTraces } = await import\('\.\.\/\.\.\/lib\/mockReviewCache'\);\n/g, '');

  // 2. Remove `if (appId === '00000000-0000-0000-0000-000000000000') { ... }` overrides completely
  content = content.replace(/\/\/ USER REQUESTED OVERRIDE:[\s\S]*?if \(appId === '00000000-0000-0000-0000-000000000000'\) {\s*avg_score = 94;\s*}\n/g, '');
  content = content.replace(/\/\/ --- USER REQUESTED EXACT 7-DAY SEQUENCE ---[\s\S]*?if \(appId === '00000000-0000-0000-0000-000000000000'\) {[\s\S]*?}\n\s*}/g, '');
  content = content.replace(/if \(appId === '00000000-0000-0000-0000-000000000000'\) {\s*avgScoreTrend = [^}]+}/g, '');

  // 3. Remove `!userData?.user && !isGuest` to just `!userData?.user`
  content = content.replace(/if \(!userData\?\.user && !isGuest\) {/g, 'if (!userData?.user) {');
  
  // 4. Remove `const isGuest = ...;`
  content = content.replace(/const isGuest = Astro\.cookies\.has\('guest_mode'\) && Astro\.cookies\.get\('guest_mode'\)\?\.value === 'true';\s*\n?/g, '');

  // 5. Remove `else if (isGuest) { projectId = "00000000-0000-0000-0000-000000000000"; ... }`
  content = content.replace(/} else if \(isGuest\) {[\s\S]*?hasTraces = true;\n\s*}/g, '}');
  content = content.replace(/} else if \(isGuest\) {[\s\S]*?projectId = "00000000-0000-0000-0000-000000000000";\n\s*}/g, '}');
  content = content.replace(/} else if \(isGuest\) {[\s\S]*?appId = "00000000-0000-0000-0000-000000000000";\n\s*}/g, '}');

  // dashboard/index.astro special case:
  // if (isGuest) { ... } else { return Astro.redirect('/login'); }
  if (file.includes('index.astro') || file.includes('settings.astro')) {
    content = content.replace(/if \(isGuest\) {[\s\S]*?\} else \{\s*(return Astro\.redirect\('\/login'\);)\s*\}/g, '$1');
    content = content.replace(/} else if \(isGuest\) {[\s\S]*?\} else \{\s*(return Astro\.redirect\('\/login'\);)\s*\}/g, '$1');
  }

  // 6. ActionTasks.tsx guest blocks
  content = content.replace(/if \(appId === "00000000-0000-0000-0000-000000000000"\) {[\s\S]*?return;\s*}/g, '');

  if (content !== originalContent) {
    console.log("Modified:", file);
    fs.writeFileSync(file, content);
  }
});
