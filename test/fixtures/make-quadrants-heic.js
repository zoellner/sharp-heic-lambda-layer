// Generates test/fixtures/quadrants.heic: a 480x320 image with one solid colour per quadrant.
// Encoded with Apple's HEIF encoder (macOS sips) so the fixture is independent of the libheif/x265
// build under test. Usage (macOS only): node test/fixtures/make-quadrants-heic.js
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');

const { WIDTH, HEIGHT, QUADRANTS } = require('./quadrants.js');

const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body));
  return Buffer.concat([length, body, crc]);
};

const header = Buffer.alloc(13);
header.writeUInt32BE(WIDTH, 0);
header.writeUInt32BE(HEIGHT, 4);
header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB, no interlace

const rows = [];
for (let y = 0; y < HEIGHT; y++) {
  const row = Buffer.alloc(1 + WIDTH * 3); // leading 0 = no filter
  for (let x = 0; x < WIDTH; x++) {
    const { rgb } = QUADRANTS.find((q) => q.x === (x < WIDTH / 2 ? 0 : 1) && q.y === (y < HEIGHT / 2 ? 0 : 1));
    row.set(rgb, 1 + x * 3);
  }
  rows.push(row);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', header),
  chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
  chunk('IEND', Buffer.alloc(0)),
]);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quadrants-'));
const pngPath = path.join(tmp, 'quadrants.png');
fs.writeFileSync(pngPath, png);
execFileSync('sips', ['-s', 'format', 'heic', '-s', 'formatOptions', 'best', pngPath, '--out', path.join(__dirname, 'quadrants.heic')], { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true });
