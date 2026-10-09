// Smoke test for the built layer. Runs inside the public.ecr.aws/lambda/nodejs image
// with the layer mounted at /opt, see .github/workflows/test-layer.yml.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const LAYER_NODE_MODULES = '/opt/nodejs/node_modules';
const TEST_IMAGE = path.resolve(__dirname, '../examples/src/test-input.heic');
const TEST_IMAGE_WIDTH = 3024;
const TEST_IMAGE_HEIGHT = 4032;

// Synthetic HEIC with one solid colour per quadrant, see test/fixtures/make-quadrants-heic.js.
const QUADRANTS_IMAGE = path.resolve(__dirname, 'fixtures/quadrants.heic');
const QUADRANTS_LAYOUT = require('./fixtures/quadrants.js');

// Samples the centre of each quadrant, which also catches flipped or rotated output.
const assertQuadrantColours = async (input, tolerance) => {
  const sharp = require('sharp');
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const { name, x, y, rgb } of QUADRANTS_LAYOUT.QUADRANTS) {
    const cx = Math.floor((x + 0.5) * info.width / 2);
    const cy = Math.floor((y + 0.5) * info.height / 2);
    const i = (cy * info.width + cx) * info.channels;
    const actual = [data[i], data[i + 1], data[i + 2]];
    const ok = actual.every((value, c) => Math.abs(value - rgb[c]) <= tolerance);
    assert.ok(ok, `${name}: expected ${rgb} ±${tolerance}, got ${actual}`);
  }
};

const findSharpBinary = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findSharpBinary(full);
      if (found) return found;
    } else if (/(^|\/)Release\/sharp[^/]*\.node$/.test(full)) {
      return full;
    }
  }
  return null;
};

test('compiled sharp addon resolves all shared libraries', () => {
  const binary = findSharpBinary(path.join(LAYER_NODE_MODULES, 'sharp'));
  assert.ok(binary, 'compiled sharp addon not found in layer');

  // ldd is not guaranteed to exist in the Lambda image, so ask the dynamic loader directly.
  const loader = ['/lib64/ld-linux-x86-64.so.2', '/lib/ld-linux-aarch64.so.1'].find((p) => fs.existsSync(p));
  assert.ok(loader, 'dynamic loader not found');
  const output = execFileSync(loader, ['--list', binary], { encoding: 'utf8' });
  console.log(output);
  assert.doesNotMatch(output, /not found/);
});

test('sharp uses the libvips built for the layer', () => {
  const sharp = require('sharp');
  const { version } = JSON.parse(fs.readFileSync(path.join(LAYER_NODE_MODULES, 'sharp/package.json'), 'utf8'));
  assert.equal(version, process.env.EXPECTED_SHARP_VERSION);
  assert.equal(sharp.versions.vips, process.env.EXPECTED_VIPS_VERSION);
  // @img/colour is a regular JS dependency; only the prebuilt @img/sharp-* binaries must be absent.
  const scope = path.join(LAYER_NODE_MODULES, '@img');
  const prebuilt = fs.existsSync(scope) ? fs.readdirSync(scope).filter((name) => name.startsWith('sharp-')) : [];
  assert.deepEqual(prebuilt, [], 'prebuilt @img/sharp-* packages must not be bundled');
});

test('sharp reports HEIF, WebP and GIF support', () => {
  const { format } = require('sharp');
  for (const name of ['heif', 'webp', 'jpeg', 'png', 'gif']) {
    assert.ok(format[name].input.buffer, `${name} input`);
    assert.ok(format[name].output.buffer, `${name} output`);
  }
});

test('decodes HEIC input', async () => {
  const sharp = require('sharp');
  const metadata = await sharp(TEST_IMAGE).metadata();
  assert.equal(metadata.format, 'heif');
  assert.equal(metadata.compression, 'hevc');
  assert.equal(metadata.width, TEST_IMAGE_WIDTH);
  assert.equal(metadata.height, TEST_IMAGE_HEIGHT);
});

test('decodes synthetic HEIC with correct dimensions and colours', async () => {
  const sharp = require('sharp');
  const metadata = await sharp(QUADRANTS_IMAGE).metadata();
  assert.equal(metadata.format, 'heif');
  assert.equal(metadata.compression, 'hevc');
  assert.equal(metadata.width, QUADRANTS_LAYOUT.WIDTH);
  assert.equal(metadata.height, QUADRANTS_LAYOUT.HEIGHT);
  await assertQuadrantColours(QUADRANTS_IMAGE, 8);
});

test('resizes synthetic HEIC to WebP with correct colours', async () => {
  const sharp = require('sharp');
  const { data, info } = await sharp(QUADRANTS_IMAGE).resize({ width: 240 }).webp().toBuffer({ resolveWithObject: true });
  assert.equal(info.format, 'webp');
  assert.equal(info.width, 240);
  assert.equal(info.height, 160);
  await assertQuadrantColours(data, 12);
});

// GIF output needs cgif and an image quantiser (libimagequant) in libvips, see #13.
test('resizes synthetic HEIC to GIF with correct colours', async () => {
  const sharp = require('sharp');
  const { data, info } = await sharp(QUADRANTS_IMAGE).resize({ width: 240 }).gif().toBuffer({ resolveWithObject: true });
  assert.equal(info.format, 'gif');
  assert.equal(info.width, 240);
  assert.equal(info.height, 160);
  assert.equal(data.toString('ascii', 0, 6), 'GIF89a');
  await assertQuadrantColours(data, 12);
});

test('encodes and resizes animated GIF', async () => {
  const sharp = require('sharp');
  const frames = await Promise.all([
    sharp(QUADRANTS_IMAGE).png().toBuffer(),
    sharp(QUADRANTS_IMAGE).flop().png().toBuffer(),
  ]);
  const animated = await sharp(frames, { join: { animated: true } }).gif({ delay: 100, loop: 0 }).toBuffer();
  // Same pipeline as #13: load all frames, resize, keep the GIF format.
  const resized = await sharp(animated, { animated: true }).resize({ width: 240 }).gif().toBuffer();
  const metadata = await sharp(resized).metadata();
  assert.equal(metadata.format, 'gif');
  assert.equal(metadata.pages, 2);
  assert.equal(metadata.width, 240);
  assert.equal(metadata.height, 160);
  await assertQuadrantColours(resized, 12);
  // The second frame is mirrored, flopping it back must restore the original layout.
  await assertQuadrantColours(await sharp(resized, { page: 1 }).flop().png().toBuffer(), 12);
});

// Without a quantiser libvips only warns and silently writes a truecolour PNG, so check the
// colour type in the IHDR chunk (byte 25, 3 = indexed colour) rather than just the call succeeding.
test('encodes palette PNG', async () => {
  const sharp = require('sharp');
  const encoded = await sharp(QUADRANTS_IMAGE).png({ palette: true }).toBuffer();
  assert.equal(encoded.toString('ascii', 12, 16), 'IHDR');
  assert.equal(encoded[25], 3, 'PNG colour type should be indexed');
  const metadata = await sharp(encoded).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.isPalette, true);
  assert.equal(metadata.width, QUADRANTS_LAYOUT.WIDTH);
  assert.equal(metadata.height, QUADRANTS_LAYOUT.HEIGHT);
  await assertQuadrantColours(encoded, 12);
});

test('resizes HEIC to WebP', async () => {
  const sharp = require('sharp');
  const { info } = await sharp(TEST_IMAGE).resize({ width: 200 }).webp().toBuffer({ resolveWithObject: true });
  assert.equal(info.format, 'webp');
  assert.equal(info.width, 200);
  assert.equal(info.height, Math.round(200 * TEST_IMAGE_HEIGHT / TEST_IMAGE_WIDTH));
});

for (const { compression, encoder, options } of [
  // sharp defaults to tune 'auto', which libheif's x265 plugin rejects (only psnr, ssim, grain, fastdecode).
  // https://github.com/lovell/sharp/issues/4621
  { compression: 'hevc', encoder: 'x265', options: { tune: 'ssim' } },
  { compression: 'av1', encoder: 'libaom', options: {} },
]) {
  test(`encodes and decodes HEIF with ${compression} (${encoder})`, async () => {
    const sharp = require('sharp');
    const encoded = await sharp(QUADRANTS_IMAGE).heif({ compression, quality: 80, ...options }).toBuffer();
    const metadata = await sharp(encoded).metadata();
    assert.equal(metadata.format, 'heif');
    assert.equal(metadata.compression, compression);
    assert.equal(metadata.width, QUADRANTS_LAYOUT.WIDTH);
    assert.equal(metadata.height, QUADRANTS_LAYOUT.HEIGHT);
    await assertQuadrantColours(encoded, 12);
  });
}
