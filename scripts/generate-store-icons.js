/**
 * Microsoft Store Icon Generator
 * Generates all required icon sizes for AppX/MSIX packages
 * 
 * Run: node scripts/generate-store-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');

const SOURCE_ICON = path.join(__dirname, '../build/icon.png');
const OUTPUT_DIR = path.join(__dirname, '../build/appx');

// Microsoft Store required assets with their sizes
const ASSETS = {
  // Store Logo (shown in Store listing)
  'StoreLogo': [
    { scale: 100, size: 50 },
    { scale: 125, size: 63 },
    { scale: 150, size: 75 },
    { scale: 200, size: 100 },
    { scale: 400, size: 200 },
  ],
  
  // Square 44x44 Logo (taskbar, Start menu small)
  'Square44x44Logo': [
    { scale: 100, size: 44 },
    { scale: 125, size: 55 },
    { scale: 150, size: 66 },
    { scale: 200, size: 88 },
    { scale: 400, size: 176 },
  ],
  
  // Square 150x150 Logo (Start menu medium tile)
  'Square150x150Logo': [
    { scale: 100, size: 150 },
    { scale: 125, size: 188 },
    { scale: 150, size: 225 },
    { scale: 200, size: 300 },
    { scale: 400, size: 600 },
  ],
  
  // Wide 310x150 Logo (Start menu wide tile)
  'Wide310x150Logo': [
    { scale: 100, width: 310, height: 150 },
    { scale: 125, width: 388, height: 188 },
    { scale: 150, width: 465, height: 225 },
    { scale: 200, width: 620, height: 300 },
    { scale: 400, width: 1240, height: 600 },
  ],
  
  // Large Tile 310x310 (Start menu large tile)
  'LargeTile': [
    { scale: 100, size: 310 },
    { scale: 125, size: 388 },
    { scale: 150, size: 465 },
    { scale: 200, size: 620 },
    { scale: 400, size: 1240 },
  ],
  
  // Splash Screen
  'SplashScreen': [
    { scale: 100, width: 620, height: 300 },
    { scale: 125, width: 775, height: 375 },
    { scale: 150, width: 930, height: 450 },
    { scale: 200, width: 1240, height: 600 },
    { scale: 400, width: 2480, height: 1200 },
  ],
  
  // Badge Logo (lock screen)
  'BadgeLogo': [
    { scale: 100, size: 24 },
    { scale: 200, size: 48 },
  ],
};

async function generateIcons() {
  console.log('🎨 Microsoft Store Icon Generator\n');
  
  // Ensure output directory exists
  await fs.ensureDir(OUTPUT_DIR);
  
  // Check if source icon exists
  if (!await fs.pathExists(SOURCE_ICON)) {
    console.error('❌ Source icon not found:', SOURCE_ICON);
    process.exit(1);
  }
  
  console.log('📁 Source:', SOURCE_ICON);
  console.log('📁 Output:', OUTPUT_DIR);
  console.log('');
  
  let totalGenerated = 0;
  
  for (const [assetName, sizes] of Object.entries(ASSETS)) {
    console.log(`\n📦 Generating ${assetName}...`);
    
    for (const sizeConfig of sizes) {
      const { scale, size, width, height } = sizeConfig;
      const finalWidth = width || size;
      const finalHeight = height || size;
      
      const filename = `${assetName}.scale-${scale}.png`;
      const outputPath = path.join(OUTPUT_DIR, filename);
      
      try {
        // For wide/splash images, we need to handle differently
        if (width && height && width !== height) {
          // Create a canvas with the target dimensions and center the icon
          const iconSize = Math.min(width, height) * 0.6; // Icon takes 60% of smaller dimension
          
          await sharp(SOURCE_ICON)
            .resize(Math.round(iconSize), Math.round(iconSize), { fit: 'contain' })
            .extend({
              top: Math.round((height - iconSize) / 2),
              bottom: Math.round((height - iconSize) / 2),
              left: Math.round((width - iconSize) / 2),
              right: Math.round((width - iconSize) / 2),
              background: { r: 26, g: 26, b: 46, alpha: 1 } // #1a1a2e
            })
            .resize(width, height, { fit: 'cover' })
            .png()
            .toFile(outputPath);
        } else {
          // Square icons - simple resize
          await sharp(SOURCE_ICON)
            .resize(finalWidth, finalHeight, { fit: 'contain' })
            .png()
            .toFile(outputPath);
        }
        
        console.log(`   ✅ ${filename} (${finalWidth}x${finalHeight})`);
        totalGenerated++;
      } catch (error) {
        console.error(`   ❌ Failed to generate ${filename}:`, error.message);
      }
    }
  }
  
  console.log(`\n✨ Generated ${totalGenerated} icon files in ${OUTPUT_DIR}`);
  
  // Also generate store listing icon (300x300)
  const storeListingPath = path.join(__dirname, '../store-assets/StoreIcon.png');
  await fs.ensureDir(path.dirname(storeListingPath));
  await sharp(SOURCE_ICON)
    .resize(300, 300, { fit: 'contain' })
    .png()
    .toFile(storeListingPath);
  console.log(`✅ Store listing icon: store-assets/StoreIcon.png (300x300)`);
}

generateIcons().catch(console.error);
