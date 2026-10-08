// Smoke test for the built layer. Runs inside the public.ecr.aws/lambda/nodejs image
// with the layer mounted at /opt, see .github/workflows/test-layer.yml.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const LAYER_NODE_MODULES = '/opt/nodejs/node_modules';
const TEST_IMAGE = path.resolve(__dirname, '../examples/src/test-input.heic');
const TEST_IMAGE_WIDTH = 4032;
const TEST_IMAGE_HEIGHT = 3024;

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
  assert.equal(require('sharp/package.json').version, process.env.EXPECTED_SHARP_VERSION);
  assert.equal(sharp.versions.vips, process.env.EXPECTED_VIPS_VERSION);
  assert.ok(!fs.existsSync(path.join(LAYER_NODE_MODULES, '@img')), 'prebuilt @img/sharp-* packages must not be bundled');
});

test('sharp reports HEIF and WebP support', () => {
  const { format } = require('sharp');
  for (const name of ['heif', 'webp', 'jpeg', 'png']) {
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

test('resizes HEIC to WebP', async () => {
  const sharp = require('sharp');
  const { info } = await sharp(TEST_IMAGE).resize({ width: 200 }).webp().toBuffer({ resolveWithObject: true });
  assert.equal(info.format, 'webp');
  assert.equal(info.width, 200);
  assert.equal(info.height, Math.round(200 * TEST_IMAGE_HEIGHT / TEST_IMAGE_WIDTH));
});

for (const { compression, encoder } of [
  { compression: 'hevc', encoder: 'x265' },
  { compression: 'av1', encoder: 'libaom' },
]) {
  test(`encodes and decodes HEIF with ${compression} (${encoder})`, async () => {
    const sharp = require('sharp');
    const encoded = await sharp(TEST_IMAGE).resize({ width: 320 }).heif({ compression, quality: 50 }).toBuffer();
    const metadata = await sharp(encoded).metadata();
    assert.equal(metadata.format, 'heif');
    assert.equal(metadata.compression, compression);
    assert.equal(metadata.width, 320);

    const { info } = await sharp(encoded).png().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 320);
  });
}
