const fs = require('fs');
const path = require('path');

const dest = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

// Try different possible paths
const possiblePaths = [
  path.join(__dirname, 'node_modules', '@vladmandic', 'face-api', 'model'),
  path.join(__dirname, 'node_modules', 'face-api.js', 'weights'),
  path.join(__dirname, 'node_modules', 'face-api.js', 'dist', 'weights'),
];

let src = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) { src = p; break; }
}

if (!src) {
  console.log('❌ No model folder found! Paths checked:');
  possiblePaths.forEach(p => console.log(' -', p));
  process.exit(1);
}

console.log('✅ Found models at:', src);
const files = fs.readdirSync(src);
let count = 0;
files.forEach(file => {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
  console.log(`✅ Copied: ${file}`);
  count++;
});
console.log(`\n✅ Done! ${count} files copied.`);