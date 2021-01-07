// this helper script can be used to update the AWS::ServerlessRepo::Application Metadata
//  in template.yaml when the package.json version is updated

const fs = require('fs').promises;
const path = require('path');

const version = process.argv[2];

const templateFileName = path.resolve(__dirname, '..', 'template.yaml');
const exampleTemplateFileName = path.resolve(__dirname, '..', 'examples', 'template.yaml');

Promise.all([
  updateTemplateFile(templateFileName, version),
  updateTemplateFile(exampleTemplateFileName, version),
])
.then(console.log)
.catch(console.error);

async function updateTemplateFile(filename, version) {
  const templateString = (await fs.readFile(filename)).toString();
  await fs.writeFile(filename, templateString.replace(/^(\s*SemanticVersion:\s*).*$/gm, `$1${version}`));
  return version;
}
