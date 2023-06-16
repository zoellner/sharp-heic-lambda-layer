'use strict';

const region = process.env.AWS_REGION || 'us-east-1';
const stackName = process.env.STACK_NAME || 'sharp-heic-lambda-layer';
const layerName = process.env.LAYER_NAME || 'sharp-heic';
const samBucket = process.env.SAM_BUCKET;
const s3Prefix = process.env.S3_PREFIX || 'sharp-heic-lambda-layer';
const organizationId = process.env.ORGANIZATION_ID || 'none';
const principal = process.env.PRINCIPAL || 'account';
const packagedTemplate = 'packaged-template.yaml';

if (!samBucket) {throw new Error('SAM_BUCKET environment variable is required');}

console.log(`version = 0.1
[default.package.parameters]
s3_bucket = "${samBucket}"
s3_prefix = "${s3Prefix}"
region = "${region}"
output_template_file = "${packagedTemplate}"
[default.deploy.parameters]
stack_name = "${stackName}"
layer_name = "${layerName}"
s3_bucket = "${samBucket}"
s3_prefix = "${s3Prefix}"
region = "${region}"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "OrganizationId=${organizationId} Principal=${principal} LayerName=${layerName}"
template_file  = "${packagedTemplate}"
`);
