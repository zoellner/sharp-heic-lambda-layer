# Sharp for AWS Lambda (with HEIC support)
AWS Lambda Layer providing [sharp](https://github.com/lovell/sharp) with HEIC (and WebP) support

![Build Status](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiKzJabytWb002SWpGcnVPMFp2K2VIZVR3QTZkYkx5L1gyZmFyV281emxnNzRFeklPdWF6ZDdBVllBczA4MVFxdDhpZnBaMnNneFk5WWx4Y3ZxUkplejIwPSIsIml2UGFyYW1ldGVyU3BlYyI6IkJKYlVqRVNSQlk2am5rUmwiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=main)

## Prerequisites

 * Docker
 * [SAM v1.33.0 or higher](https://github.com/awsdocs/aws-sam-developer-guide/blob/master/doc_source/serverless-sam-cli-install.md)

## Usage

Due to potential license concerns for the HEVC patent group, this repo can't be provided in the most convenient way which would be a shared lambda layer or an Application in the AWS Serverless Repo.

But you can compile and deploy this lambda layer yourself at your own risk and use it wihin your own accounts. All you need is an S3 bucket to deploy the compiled code to (replace `your-s3-bucket` in the code snippet below). Please see the note below regarding the build process.

It is recommended to automate this process using AWS CodeBuild. A buildspec file is provided in the repo. In that case you'll have to set the `SAM_BUCKET` environment variable in CodeBuild. For other environment variables see the table below.

```bash
npm run build
SAM_BUCKET=your-s3-bucket npm run deploy
```


The example can be deployed using the following commands
```bash
cd examples
sam build
sam deploy --guided
```

### Lambda Layer
- Add the lambda layer with ARN `arn:aws:lambda:us-east-1:${AWS:AccountId}:layer:sharp-heic:${LAYER_VERSION}` to any lambda function (replace `${LAYER_VERSION}` with the appropriate version and `${AWS:AccountId}` if you're not using a layer from the same account as the function). You can also import the layer ARN using `!ImportValue SharpHEICLayerArn`.
- Remove sharp from the dependencies in the function code (it will otherwise conflict with the one provided through the layer)
- See [example template](examples/sam-template.yaml) for a complete sample template.

### Environment Variables for build
|            Name | Required |           Default Value |                                   Description |
|-----------------|----------|-------------------------|-----------------------------------------------|
|      SAM_BUCKET |      yes |                         | Name of S3 Bucket to store layer              |
|       S3_PREFIX |       no | sharp-heic-lambda-layer | Prefix within S3 Bucket to store layer        |
|      STACK_NAME |       no | sharp-heic-lambda-layer | Name of CloudFormation stack                  |
|      AWS_REGION |       no |               us-east-1 | AWS Region to deploy to                       |
| ORGANIZATION_ID |       no |                    none | ID of Organization to grant access to layer   |
|       PRINCIPAL |       no |                 account | Principal to grant access to layer            |

For details on `ORGANIZATION_ID` and `PRINCIPAL` please see the equivalent properties in the [CloudFormation Docs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-layerversionpermission.html).

The special value `none` for `ORGANIZATION_ID` is used to disable organization based access.
The special value `account` for `PRINCIPAL` is used to give access to the account the layer is deployed to.

The environment variables are used to create a `samconfig.toml` file that configures the `sam package` and `sam deploy` commands.

### Note regarding build process
Previously, some custom docker images were needed to build this layer. AWS has since published newer images which work out of the box. `saml-cli` version `v1.33.0` is using `public.ecr.aws/sam/build-nodejs14.x:latest-x86_64`

## Background
This repo exists as it is rather painful to compile all libraries required to get sharp to work with HEIC/HEIF files in an AWS Lambda environment. The sharp repository has several [issues](https://github.com/lovell/sharp/issues) related to this.


### Layer contents
This lambda layer contains the node module [sharp](https://github.com/lovell/sharp). But unlike a normal installation via `npm i sharp` this layer does not use the prebuilt sharp and libvips binaries. This layer compiles libwebp, libde265, libheif, libvips, and sharp from source in order to provide HEIC/HEIF (and webp) functionality in an AWS Lambda environment.

### Dependencies
The following table lists the release version of this repo together with the version of each dependency. Patch versions are related to the build process or documentation and have the same dependencies as the minor version.
| release |  sharp | libvips | libheif | libwebp | libde265 | nodejs |
|---------|--------|---------|---------|---------|----------|--------|
|   1.1.0 | 0.27.0 |  8.10.5 |  1.10.0 |   1.1.0 |    1.0.8 |     12 |
|   1.2.0 | 0.28.2 |  8.10.6 |  1.12.0 |   1.2.0 |    1.0.8 |     12 |
|   2.0.0 | 0.29.1 |  8.11.3 |  1.12.0 |   1.2.1 |    1.0.8 |     14 |

### CompatibleRuntimes
- `nodejs12.x` (v1.x)
- `nodejs14.x` (v2.x)


## Contributions
If you would like to contribute to this repository, please open an issue or submit a PR.

You can also use the Sponsor button on the right if you'd like.

## Licenses
- libheif and libde265 are distributed under the terms of the GNU Lesser General Public License. Copyright Struktur AG. See https://github.com/strukturag/libheif/blob/master/COPYING and https://github.com/strukturag/libde265/blob/master/COPYING for details.
- libwebp is Copyright Google Inc. See https://github.com/webmproject/libwebp/blob/master/COPYING for details.
- sharp is licensed under the Apache License, Version 2.0. Copyright Lovell Fuller and contributors. See https://github.com/lovell/sharp/blob/master/LICENSE for details.
- libvips is licensed under the LGPL 2.1+. See https://github.com/libvips/libvips/blob/master/COPYING for details.
- The remainder of the code in this repository is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Related Resources
Visit [sharp.pixelplumbing.com](https://sharp.pixelplumbing.com/) for complete instructions on sharp.

### Code Repositories
- [sharp](https://github.com/lovell/sharp)
- [libheif](https://github.com/strukturag/libheif)
- [libde265](https://github.com/strukturag/libde265)
- [libwebp](https://github.com/webmproject/libwebp)
- [libvips](https://github.com/libvips/libvips)
