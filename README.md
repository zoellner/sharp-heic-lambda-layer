# Sharp for AWS Lambda (with HEIC support)
AWS Lambda Layer providing [sharp](https://github.com/lovell/sharp) with HEIC (and WebP) support

![Build Status](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiKzJabytWb002SWpGcnVPMFp2K2VIZVR3QTZkYkx5L1gyZmFyV281emxnNzRFeklPdWF6ZDdBVllBczA4MVFxdDhpZnBaMnNneFk5WWx4Y3ZxUkplejIwPSIsIml2UGFyYW1ldGVyU3BlYyI6IkJKYlVqRVNSQlk2am5rUmwiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=main)


## Usage

### Serverless Application
Add a `AWS::Serverless::Application` resource similar to the one below to a SAM template and reference the layer in a lambda function using `!GetAtt SharpHEIC.Outputs.SharpHEICLayerArn`

```yaml
  SharpHEIC:
    Type: AWS::Serverless::Application
    Properties:
      Location:
        ApplicationId: arn:aws:serverlessrepo:us-east-1:776954778331:applications/sharp-heic
        SemanticVersion: 1.0.0
```
See [example template](examples/sam-template.yaml) for a complete sample template.

The example can be deployed using the following commands
```bash
cd examples
sam build
sam deploy --guided --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
```

### Lambda Layer
- Add the lambda layer with ARN `arn:aws:lambda:us-east-1:776954778331:layer:sharp-heic:${LAYER_VERSION}` to any lambda function (replace `${LAYER_VERSION}` with the desired version, e.g. `5`)
- Remove sharp from the dependencies in the function code (it will otherwise conflict with the one provided through the layer)


## Background
This repo exists as it is rather painful to compile all libraries required to get sharp to work with HEIC/HEIF files in an AWS Lambda environment. The sharp repository has several [issues](https://github.com/lovell/sharp/issues) related to this.


### Layer contents
This lambda layer contains the node module [sharp](https://github.com/lovell/sharp). But unlike a normal installation via `npm i sharp` this layer does not use the prebuilt sharp and libvips binaries. This layer compiles libwebp, libde265, libheif, libvips, and sharp from source in order to provide HEIC/HEIF (and webp) functionality in an AWS Lambda environment.

### Dependencies
The following table lists the layer version and SAM Application version together with the version of each dependency
| Layer |    SAM |  sharp | libvips | libheif | libwebp | libde265 |
|-------|--------|--------|---------|---------|---------|----------|
|     5 |  1.0.0 | 0.27.0 |  8.10.5 |  1.10.0 |   1.1.0 |    1.0.8 |

### CompatibleRuntimes
- `nodejs12.x`


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
