/**
 * Regenerate Wide and SplashScreen icons from new source
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');

const SOURCE_IMAGE = path.join(__dirname, '../build/splash-source.jpg');
const OUTPUT_DIR = path.join(__dirname, '../build/appx');

// Exact background color from source image corners
const BACKGROUND_COLOR = { r: 5, g: 13, b: 62, alpha: 1 }; // #050d3e - exact from source

// Only Wide and SplashScreen assets
const ASSETS = {
  // Wide 310x150 Logo (Start menu wide tile)
  'Wide310x150Logo': [
    { scale: 100, width: 310, height: 150 },
    { scale: 125, width: 388, height: 188 },
    { scale: 150, width: 465, height: 225 },
    { scale: 200, width: 620, height: 300 },
    { scale: 400, width: 1240, height: 600 },
  ],
  
  // Splash Screen
  'SplashScreen': [
    { scale: 100, width: 620, height: 300 },
    { scale: 125, width: 775, height: 375 },
    { scale: 150, width: 930, height: 450 },
    { scale: 200, width: 1240, height: 600 },
    { scale: 400, width: 2480, height: 1200 },
  ],
};

async function regenerateIcons() {
  console.log('🎨 Regenerating Wide & SplashScreen Icons\n');
  
  if (!await fs.pathExists(SOURCE_IMAGE)) {
    console.error('❌ Source image not found:', SOURCE_IMAGE);
    process.exit(1);
  }
  
  console.log('📁 Source:', SOURCE_IMAGE);
  console.log('📁 Output:', OUTPUT_DIR);
  console.log('');
  
  let totalGenerated = 0;
  
  for (const [assetName, sizes] of Object.entries(ASSETS)) {
    console.log(`\n📦 Generating ${assetName}...`);
    
    for (const sizeConfig of sizes) {
      const { scale, width, height } = sizeConfig;
      
      const filename = `${assetName}.scale-${scale}.png`;
      const outputPath = path.join(OUTPUT_DIR, filename);
      
      try {
        // Use contain to fit the entire logo without cropping
        // Then extend with background color to fill the exact dimensions
        await sharp(SOURCE_IMAGE)
          .resize(width, height, { 
            fit: 'contain',  // Fit entire image without cropping
            background: BACKGROUND_COLOR
          })
          .flatten({ background: BACKGROUND_COLOR }) // Ensure solid background
          .png()
          .toFile(outputPath);
        
        console.log(`   ✅ ${filename} (${width}x${height})`);
        totalGenerated++;
      } catch (error) {
        console.error(`   ❌ Failed to generate ${filename}:`, error.message);
      }
    }
  }
  
  console.log(`\n✨ Regenerated ${totalGenerated} icon files`);
}

regenerateIcons().catch(console.error);
