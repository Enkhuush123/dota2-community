const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Fixing steam-resources for dota2 package...");

const nodeModulesDir = path.join(__dirname, '..', 'node_modules');
const targetDir = path.join(nodeModulesDir, 'steam-resources');
const sourceDir = path.join(nodeModulesDir, 'steam', 'node_modules', 'steam-resources');

try {
  // rm -rf node_modules/steam-resources
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // cp -r node_modules/steam/node_modules/steam-resources node_modules/
  if (fs.existsSync(sourceDir)) {
    fs.cpSync(sourceDir, targetDir, { recursive: true });
  } else {
    console.warn("Warning: Source directory not found:", sourceDir);
  }

  // cd node_modules/steam-resources
  // npm install protobufjs@4.1.3 --no-save
  if (fs.existsSync(targetDir)) {
    execSync('npm install protobufjs@4.1.3 --no-save', { cwd: targetDir, stdio: 'inherit' });
    console.log("steam-resources fixed!");
  }
} catch (err) {
  console.error("Error fixing steam-resources:", err);
  process.exit(1);
}
