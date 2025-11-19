const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', '@mediapipe', 'tasks-vision', 'vision_bundle.mjs.map');
const link = path.join(__dirname, '..', 'node_modules', '@mediapipe', 'tasks-vision', 'vision_bundle_mjs.js.map');

if (fs.existsSync(target) && !fs.existsSync(link)) {
  try {
    fs.symlinkSync('vision_bundle.mjs.map', link);
    console.log('✓ Created symlink for vision_bundle_mjs.js.map');
  } catch (error) {
    console.warn('⚠ Could not create symlink:', error.message);
  }
}

