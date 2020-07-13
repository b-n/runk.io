const childProcess = require('child_process');

const sls = childProcess.spawn(
  'npx',
  ['sls','offline','start'],
  { stdio: [process.stdin, process.stdout, process.stderr]}
);

const elasticmq = childProcess.spawn(
  'java',
  ['-jar', 'elasticmq.jar'],
  { stdio: [process.stdin, process.stdout, process.stderr]}
);

const killAll = () => {
  sls.kill('SIGINT');
  elasticmq.kill('SIGINT');
}

process.once('SIGINT', killAll);
process.once('SIGTERM', killAll);
