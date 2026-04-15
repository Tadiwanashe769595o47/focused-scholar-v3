// Convert PNG to ICO - pure Node.js, no external dependencies
import fs from 'fs';

function convertPngToIco(pngPath, icoPath) {
  console.log(`Converting ${pngPath} to ${icoPath}...`);
  
  const pngBuffer = fs.readFileSync(pngPath);
  
  // ICO file format:
  // 6 byte header + 16 byte directory entry + PNG data
  // For a single 256x256 PNG-encoded icon
  
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);  // Reserved (must be 0)
  header.writeUInt16LE(1, 2);  // Type (1 = ICO)
  header.writeUInt16LE(1, 4);  // Number of images
  
  // Directory entry (16 bytes)
  const dirEntry = Buffer.alloc(16);
  dirEntry[0] = 0;   // Width (0 = 256)
  dirEntry[1] = 0;   // Height (0 = 256)
  dirEntry[2] = 0;   // Color palette
  dirEntry[3] = 0;   // Reserved
  dirEntry.writeUInt16LE(1, 4);   // Color planes
  dirEntry.writeUInt16LE(32, 6);  // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8);   // Size of image data
  dirEntry.writeUInt32LE(22, 12);  // Offset to image data (6 + 16 = 22)
  
  const icoBuffer = Buffer.concat([header, dirEntry, pngBuffer]);
  fs.writeFileSync(icoPath, icoBuffer);
  
  console.log(`✓ Created ICO file: ${icoPath} (${icoBuffer.length} bytes)`);
}

// Convert our icon
convertPngToIco('build/icon.png', 'build/icon.ico');
