const WriteStream = require('./writable');

function createLogger(options = {}) {
  return new WriteStream(options);
}

module.exports = {createLogger};
// es2015 default export compatibility
module.exports.default = module.exports;
