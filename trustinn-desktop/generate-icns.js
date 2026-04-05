#!/usr/bin/env node
/**
 * Convert PNG icon to macOS ICNS format
 * Requires ImageMagick: brew install imagemagick
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceIcon = path.join(__dirname, 'assets/icons/icon-256.png');
const outputDir = path.join(__dirname, 'assets/icons');
const iconsetDir = path.join(outputDir, 'icon.iconset');
const outputIcons = path.join(outputDir, 'icon.icns');

// Check if source icon exists
if (!fs.existsSync(sourceIcon)) {
  console.error('❌ Source icon not found:', sourceIcon);
  process.exit(1);
}

try {
  console.log('🔄 Creating icon.iconset directory...');
  
  // Remove existing iconset if present
  if (fs.existsSync(iconsetDir)) {
    execSync(`rm -rf "${iconsetDir}"`);
  }
  
  fs.mkdirSync(iconsetDir, { recursive: true });

  // Convert PNG to various sizes required for ICNS
  const sizes = [
    { size: 16, scale: 1 },
    { size: 16, scale: 2 },
    { size: 32, scale: 1 },
    { size: 32, scale: 2 },
    { size: 64, scale: 1 },
    { size: 64, scale: 2 },
    { size: 128, scale: 1 },
    { size: 128, scale: 2 },
    { size: 256, scale: 1 },
    { size: 256, scale: 2 },
    { size: 512, scale: 1 },
    { size: 512, scale: 2 },
  ];

  console.log('📐 Converting PNG to required icon sizes...');

  for (const { size, scale } of sizes) {
    const dimension = size * scale;
    const name =
      scale === 2
        ? `icon_${size}x${size}@2x.png`
        : `icon_${size}x${size}.png`;
    const outputPath = path.join(iconsetDir, name);

    try {
      execSync(
        `convert "${sourceIcon}" -resize ${dimension}x${dimension} "${outputPath}"`,
        { stdio: 'pipe' }
      );
      console.log(`  ✓ Created ${name}`);
    } catch (err) {
      // Fallback: use sips if available (macOS native)
      try {
        execSync(
          `sips -z ${size} ${size} "${sourceIcon}" --out "${outputPath}"`,
          { stdio: 'pipe' }
        );
        console.log(`  ✓ Created ${name} (via sips)`);
      } catch (fallbackErr) {
        console.warn(`  ⚠️  Warning: Failed to create ${name}`);
      }
    }
  }

  // Convert iconset to ICNS
  console.log('🎨 Converting iconset to ICNS format...');
  try {
    // Try macOS iconutil first
    try {
      execSync(`iconutil -c icns "${iconsetDir}" -o "${outputIcons}"`, {
        stdio: 'pipe',
      });
      console.log(`✅ Successfully created: ${outputIcons}`);
    } catch (macErr) {
      // Fallback: Use ImageMagick to create ICNS from PNG
      console.log('  (macOS iconutil not available, using ImageMagick...)');
      execSync(
        `convert "${sourceIcon}" -define icon:auto-resize=512,256,128,96,64,48,32,16 "${outputIcons}"`,
        { stdio: 'pipe' }
      );
      console.log(`✅ Successfully created: ${outputIcons} (via ImageMagick)`);
    }
    
    // Clean up
    execSync(`rm -rf "${iconsetDir}"`);
    console.log('🧹 Cleaned up temporary files');
  } catch (err) {
    console.error('❌ Failed to create ICNS file');
    console.error('Error:', err.message);
    console.error('Requirements: macOS (iconutil) OR ImageMagick (convert)');
    console.error('Install ImageMagick: sudo apt-get install imagemagick (Linux) or brew install imagemagick (macOS)');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
