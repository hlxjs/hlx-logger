[![Build Status](https://travis-ci.org/hlxjs/hlx-logger.svg?branch=master)](https://travis-ci.org/hlxjs/hlx-logger)
[![Coverage Status](https://coveralls.io/repos/github/hlxjs/hlx-logger/badge.svg?branch=master)](https://coveralls.io/github/hlxjs/hlx-logger?branch=master)
[![Dependency Status](https://david-dm.org/hlxjs/hlx-logger.svg)](https://david-dm.org/hlxjs/hlx-logger)
[![Development Dependency Status](https://david-dm.org/hlxjs/hlx-logger/dev-status.svg)](https://david-dm.org/hlxjs/hlx-logger#info=devDependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/hlxjs/hlx-logger/badge.svg)](https://snyk.io/test/github/hlxjs/hlx-logger)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

# hlx-logger
A passthrough stream that skims all data and logs them into a file or stdout

## Features
* Being used with other [`hlx`](https://github.com/hlxjs) objects, it provides a functionality to log all `data` events into a  file or STDOUT
* Timestamp is in UTC

## Install
[![NPM](https://nodei.co/npm/hlx-logger.png?mini=true)](https://nodei.co/npm/hlx-logger/)

## Usage

```js
const hlx = require('hlx');
const {createLogger} = require('hlx-logger');

const logger = createLogger({
  level: 'simple',
  outDir: '/var/log/hls-events'
});

// Log all events into a file
hlx.src('http://example.com/master.m3u8')
.pipe(logger)
.pipe(hlx.dest())
.on('error', err => {
  console.log(err.stack);
});
```
## API
The features are built on top of the Node's [transform streams](https://nodejs.org/api/stream.html#stream_class_stream_transform).

### `createLogger(options)`
Creates a new `TransformStream` object.

#### params
| Name    | Type   | Required | Default | Description   |
| ------- | ------ | -------- | ------- | ------------- |
| options | object | No       | {}      | See below     |

#### options
| Name        | Type   | Default | Description                       |
| ----------- | ------ | ------- | --------------------------------- |
| level | string | 'simple' | `level` should be either of 'simple', 'objDump', or 'raw' |
| outDir | string | All logs are output to `process.stdout` | `outDir` should be a path to a directory in which log files are stored  |
| omitTime | boolean | false | If true, timestamps are not logged |

#### return value
An instance of `TransformStream`.
