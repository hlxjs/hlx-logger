const {Transform} = require('stream');

const {getOutput} = require('./util');
const createLogger = require('./logger');

class WriteStream extends Transform {
  constructor(options = {}) {
    super({objectMode: true});
    this.logger = createLogger(options, getOutput(options.outDir));
  }

  _transform(data, _, cb) {
    this.logger(data);
    cb(null, data);
  }
}

module.exports = WriteStream;
