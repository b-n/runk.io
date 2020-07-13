const childProcess = require('child_process');
const fs = require('fs');
const fetch = require('node-fetch');

childProcess.spawn(
  'npx',
  ['sls', 'dynamodb', 'install'],
  { stdio: [process.stdin, process.stdout, process.stderr]},
);

const packageJson = JSON.parse(fs.readFileSync('./package.json'));

Promise.all(
  Object.entries(packageJson.files).map(([file, path]) => {
    const localFile = fs.createWriteStream(file);
    return fetch(path)
      .then(response => response.body.pipe(localFile))
      .then(() => console.log(`${file} downloaded from ${path}`));
  })
);
