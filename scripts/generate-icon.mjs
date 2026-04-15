// Generate a proper PNG icon using pure Node.js
// Minimal PNG encoder from scratch

import fs from 'fs';
import zlib from 'zlib';

const SIZE = 256;

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcData = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeBuf, data, crc]);
}

// Create pixel data with gradient (purple to pink)
const rawData = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    const t = (x + y) / (SIZE * 2);
    
    // Rounded corners check
    const r = 40;
    let dx = 0, dy = 0;
    if (x < r) dx = r - x;
    else if (x >= SIZE - r) dx = x - (SIZE - 1 - r);
    if (y < r) dy = r - y;
    else if (y >= SIZE - r) dy = y - (SIZE - 1 - r);
    
    if (dx > 0 && dy > 0 && Math.sqrt(dx*dx + dy*dy) > r) {
      rawData[i] = 0; rawData[i+1] = 0; rawData[i+2] = 0; rawData[i+3] = 0;
    } else {
      rawData[i] = Math.round(99 + (217 - 99) * t);     // R
      rawData[i+1] = Math.round(102 + (70 - 102) * t);   // G
      rawData[i+2] = Math.round(241 + (239 - 241) * t);  // B
      rawData[i+3] = 255; // A
    }
  }
}

// Add "FS" text approximation (simple block letters)
// Draw white "F" and "S" shapes
function drawText() {
  const centerX = SIZE / 2;
  const centerY = SIZE / 2 - 15;
  const fontSize = 90;
  
  // Simple approach: create a rough "FS" using rectangles
  // F
  const fX = centerX - 55;
  const fY = centerY - 35;
  for (let y = 0; y < 70; y++) {
    for (let x = 0; x < 45; x++) {
      const px = fX + x;
      const py = fY + y;
      if (px < 0 || px >= SIZE || py < 0 || py >= SIZE) continue;
      
      // F shape
      const isF = (x < 10) || (y < 10) || (y >= 30 && y < 40 && x < 35);
      if (isF) {
        const i = (py * SIZE + px) * 4;
        rawData[i] = 255; rawData[i+1] = 255; rawData[i+2] = 255; rawData[i+3] = 255;
      }
    }
  }
  
  // S
  const sX = centerX + 10;
  const sY = centerY - 35;
  for (let y = 0; y < 70; y++) {
    for (let x = 0; x < 45; x++) {
      const px = sX + x;
      const py = sY + y;
      if (px < 0 || px >= SIZE || py < 0 || py >= SIZE) continue;
      
      // S shape
      const isS = (y < 10) || (y >= 30 && y < 40) || (y >= 60) ||
                  (x < 10 && y < 35) || (x >= 35 && y >= 35);
      if (isS) {
        const i = (py * SIZE + px) * 4;
        rawData[i] = 255; rawData[i+1] = 255; rawData[i+2] = 255; rawData[i+3] = 255;
      }
    }
  }
}

drawText();

// Convert to PNG format
const IHDR = Buffer.alloc(13);
IHDR.writeUInt32BE(SIZE);
IHDR.writeUInt32BE(SIZE, 4);
IHDR[8] = 8;  // bit depth
IHDR[9] = 6;  // color type (RGBA)
IHDR[10] = 0; // compression
IHDR[11] = 0; // filter
IHDR[12] = 0; // interlace

// Create IDAT data (with filter byte per row)
const filteredData = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  filteredData[y * (SIZE * 4 + 1)] = 0; // no filter
  rawData.copy(filteredData, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const compressed = zlib.deflateSync(filteredData, { level: 9 });

// Build PNG
const PNG_HEADER = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdrChunk = createChunk('IHDR', IHDR);
const idatChunk = createChunk('IDAT', compressed);
const iendChunk = createChunk('IEND', Buffer.alloc(0));

const png = Buffer.concat([PNG_HEADER, ihdrChunk, idatChunk, iendChunk]);
fs.writeFileSync('build/icon.png', png);
console.log('✓ Created build/icon.png (' + png.length + ' bytes)');
