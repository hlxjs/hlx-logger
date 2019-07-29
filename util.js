const fs = require('fs');
const path = require('path');
const debug = require('debug');
const {getDateString, getDateTimeString} = require('hlx-util');

const print = debug('hlx-logger');

function getFileName() {
  return `${getDateString(new Date())}.log`;
}

function getOutput(root) {
  print(`outDir: "${root}"`);
  if (!root || !fs.existsSync(root)) {
    print('Output file is STDOUT');
    return process.stdout;
  }
  const filePath = path.join(root, getFileName());
  print(`Output file is "${filePath}"`);
  return fs.createWriteStream(filePath, {flags: 'a'});
}

module.exports = {
  getDateTimeString,
  getOutput
};
