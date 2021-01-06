
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

exports.handler = async (event) => {
  console.log(event);
  const input = await fs.readFile(path.resolve(__dirname, 'test-input.heic'));
  const {data, info} = await sharp(input, {failOnError: false})
    .resize({ width: 200 })
    .toFormat('webp')
    .toBuffer({resolveWithObject: true});
  console.log(info);
  // await fs.writeFile(path.resolve(__dirname, 'test-output.webp'), data);
  return imageResponse(data, info);
};

function imageResponse(data, info) {
  return {
    statusCode: 200,
    headers: {
      'content-type': info.format ? `image/${info.format}` : 'image/jpeg',
    },
    body: data.toString('base64'),
    isBase64Encoded: true
  };
}

exports.handler();
