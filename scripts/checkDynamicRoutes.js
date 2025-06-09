const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/pages/api/collection-videos');
if (!fs.existsSync(dir)) {
  console.error(`ERROR: Directory not found: ${dir}`);
  process.exit(1);
}
const files = fs.readdirSync(dir);
if (!files.includes('[id].ts')) {
  console.error('ERROR: Dynamic route file [id].ts is missing in collection-videos API folder.');
  process.exit(1);
}
console.log('✓ Dynamic route [id].ts found.'); 