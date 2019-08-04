const HLS = require('hls-parser');

const {getDateTimeString} = require('./util');

const logFuncs = {simple, objDump, raw};

let omitTimestamp = false;

function createLogger({level = 'simple', omitTime = false}, output) {
  let func = logFuncs[level];
  if (typeof func !== 'function') {
    func = objDump;
  }
  omitTimestamp = omitTime;
  return function (data) {
      output.write(func(data), 'utf8');
  };
}

function logMasterPlaylist({uri, variants}) {
  return `[Master Playlist] ${uri}${logVariants(variants)}\n`;
}

function logVariants(variants) {
  if (variants.length === 0) {
    return '';
  }
  const logs = [];
  for (const variant of variants) {
    logs.push(logVariant(variant));
  }
  return `\n${logs.join('\n')}`;
}

function logVariant({uri, audio, video, subtitles, closedCaptions}) {
  return `\tvariant: ${uri}${logRenditions(audio, 'audio')}${logRenditions(video, 'video')}${logRenditions(subtitles, 'subtitles')}${logRenditions(closedCaptions, 'closedCaptions')}`;
}

function logRenditions(renditions, type) {
  if (renditions.length === 0) {
    return '';
  }
  const logs = [];
  for (const rendition of renditions) {
    logs.push(logRendition(rendition, type));
  }
  return `\n${logs.join('\n')}`;
}

function logRendition({uri}, type) {
  return `\t\trendition(${type}): ${uri}`;
}

function logTimestamp() {
  return `${omitTimestamp ? '' : `${getDateTimeString()} `}`;
}

function logMediaPlaylist({uri, parentUri, playlistType = '', isIFrame, segments}) {
  return `[Media Playlist (type="${playlistType}"${isIFrame ? ', Iframe-only)' : ')'}] ${uri} (parent=${parentUri})${logSegments(segments)}\n`;
}

function logSegments(segments) {
  if (segments.length === 0) {
    return '';
  }
  const logs = [];
  for (const segment of segments) {
    logs.push(`\tsegment ${logSegment(segment)}`);
  }
  return `\n${logs.join('\n')}`;
}

function logSegment({uri, parentUri, mediaSequenceNumber, duration}, printParent) {
  return `#${mediaSequenceNumber} (${duration} sec): ${uri}${printParent ? ` (parent=${parentUri})` : ''}`;
}

function simple(data = {}) {
  if (data.type === 'playlist') {
    if (data.isMasterPlaylist) {
      return `\n${logTimestamp()}${logMasterPlaylist(data)}\n`;
    }
    return `\n${logTimestamp()}${logMediaPlaylist(data)}\n`;
  }
  if (data.type === 'segment') {
    return `${logTimestamp()}[Segment] ${logSegment(data, true)}\n`;
  }
  return '';
}

function objDump(data = {}) {
  return `---\n${JSON.stringify(data, null, 2)}\n`;
}

function raw(data = {}) {
  if (data.type === 'playlist') {
    return `===\n${data.uri}\n---\n${HLS.stringify(data)}\n`;
  }
  if (data.type === 'segment') {
    return `${logTimestamp()}[Segment] ${logSegment(data, true)}\n`;
  }
  return '';
}

module.exports = createLogger;
