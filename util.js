const fs = require('fs');
const path = require('path');
const debug = require('debug');

const print = debug('hlx-logger');

function getDateString(date) {
  return `${date.getUTCFullYear()}-${('00' + (date.getUTCMonth() + 1)).slice(-2)}-${('00' + date.getUTCDate()).slice(-2)}`;
}

function getTimeString(date) {
  return `${('00' + date.getUTCHours()).slice(-2)}:${('00' + date.getUTCMinutes()).slice(-2)}:${('00' + date.getUTCSeconds()).slice(-2)}`;
}

function getDateTimeString() {
  const date = new Date();
  return `${getDateString(date)} ${getTimeString(date)}`;
}

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
