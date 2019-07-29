const {Readable, Writable} = require('stream');
const test = require('ava');
const rewire = require('rewire');
const HLS = require('hls-parser');

function getPlaylist(url) {
  if (url.endsWith('master.m3u8')) {
    return `
      #EXTM3U
      #EXT-X-STREAM-INF:BANDWIDTH=1280000,CODECS="avc1.640029,mp4a.40.2",VIDEO="low"
      /manifest/low/main.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=2560000,CODECS="avc1.640029,mp4a.40.2",VIDEO="mid"
      /manifest/mid/main.m3u8
      #EXT-X-STREAM-INF:BANDWIDTH=7680000,CODECS="avc1.640029,mp4a.40.2",VIDEO="high"
      /manifest/high/main.m3u8

      #EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="low",NAME="Main",DEFAULT=YES,URI="/manifest/low/main.m3u8"
      #EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="low",NAME="Sub-1",DEFAULT=NO,URI="/manifest/low/sub1.m3u8"
      #EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="low",NAME="Sub-2",DEFAULT=NO,URI="/manifest/low/sub2.m3u8"

      #EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="mid",NAME="Main",DEFAULT=YES,URI="/manifest/mid/main.m3u8"
      #EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="mid",NAME="Sub-1",DEFAULT=NO,URI="/manifest/mid/sub1.m3u8"
      #EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="mid",NAME="Sub-2",DEFAULT=NO,URI="/manifest/mid/sub2.m3u8"

      #EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="high",NAME="Main",DEFAULT=YES,URI="/manifest/high/main.m3u8"
      #EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="high",NAME="Sub-1",DEFAULT=NO,URI="/manifest/high/sub1.m3u8"
      #EXT-X-MEDIA:TYPE=VIDEO,GROUP-ID="high",NAME="Sub-2",DEFAULT=NO,URI="/manifest/high/sub2.m3u8"
    `;
  }
  return `
    #EXTM3U
    #EXT-X-VERSION:3
    #EXT-X-TARGETDURATION:2
    #EXTINF:2.009,
    http://foo.bar/segment/${buildFileBase(url)}-01.ts
    #EXTINF:2.009,
    http://foo.bar/segment/${buildFileBase(url)}-02.ts
    #EXTINF:1.003,
    http://foo.bar/segment/${buildFileBase(url)}-03.ts
  `;
}

function buildFileBase(url) {
  const params = url.split('/');
  const subdir = params[params.length - 2];
  const fileBase = params[params.length - 1].replace('.m3u8', '');
  return `${subdir}/${fileBase}`;
}

function getSegments(playlistUrl) {
  const segments = [];
  let msn = 0;
  segments.push(new HLS.types.Segment({
    uri: `http://foo.bar/segment/${buildFileBase(playlistUrl)}-01.ts`,
    mediaSequenceNumber: msn++,
    duration: 2.009,
    discontinuitySequence: 0
  }));
  segments.push(new HLS.types.Segment({
    uri: `http://foo.bar/segment/${buildFileBase(playlistUrl)}-02.ts`,
    mediaSequenceNumber: msn++,
    duration: 2.009,
    discontinuitySequence: 0
  }));
  segments.push(new HLS.types.Segment({
    uri: `http://foo.bar/segment/${buildFileBase(playlistUrl)}-03.ts`,
    mediaSequenceNumber: msn++,
    duration: 1.003,
    discontinuitySequence: 0
  }));
  return segments;
}

test.cb('createLogger.simple', t => {
  class Reader extends Readable {
    constructor() {
      super({objectMode: true});
    }

    _writeMasterPlaylist(url) {
      const master = HLS.parse(getPlaylist(url));
      master.uri = url;
      this.push(master);
    }

    _writeMediaPlaylist(url) {
      const media = HLS.parse(getPlaylist(url));
      media.uri = url;
      this.push(media);
      const segments = getSegments(url);
      for (const segment of segments) {
        this.push(segment);
      }
    }

    _read() {
      this._writeMasterPlaylist('http://foo.bar/manifest/master.m3u8');
      this._writeMediaPlaylist('http://foo.bar/manifest/low/main.m3u8');
      this._writeMediaPlaylist('http://foo.bar/manifest/mid/main.m3u8');
      this._writeMediaPlaylist('http://foo.bar/manifest/high/main.m3u8');
      this.push(null);
    }
  }

  class Writer extends Writable {
    constructor() {
      super({objectMode: true});
    }

    _write(data, _, cb) {
      cb(null, data);
    }
  }

  class Tester extends Writable {
    constructor() {
      super({objectMode: true});
      this.logs = '';
    }

    _write(data, _, cb) {
      this.logs += data;
      cb(null, data);
    }
  }

  const tester = new Tester();
  const mockHlxUtil = rewire('hlx-util');
  mockHlxUtil.__set__({
    Date: class MockDate extends Date {
      constructor() {
        super(0);
      }
    }
  });
  const mockUtil = rewire('../../util');
  mockUtil.__set__({
    process: {
        stdout: tester
    },
    getDateString: mockHlxUtil.getDateString,
    getDateTimeString: mockHlxUtil.getDateTimeString
  });
  const mockWritable = rewire('../../writable');
  mockWritable.__set__({
    getOutput: mockUtil.getOutput
  });
  const mockIndex = rewire('../..');
  mockIndex.__set__({
    WriteStream: mockWritable
  });
  const {createLogger} = mockIndex;

  // const expected = '';

  const expected = `
1970-01-01 00:00:00 [Master Playlist] http://foo.bar/manifest/master.m3u8
	variant: /manifest/low/main.m3u8
		rendition(video): /manifest/low/main.m3u8
		rendition(video): /manifest/low/sub1.m3u8
		rendition(video): /manifest/low/sub2.m3u8
	variant: /manifest/mid/main.m3u8
		rendition(video): /manifest/mid/main.m3u8
		rendition(video): /manifest/mid/sub1.m3u8
		rendition(video): /manifest/mid/sub2.m3u8
	variant: /manifest/high/main.m3u8
		rendition(video): /manifest/high/main.m3u8
		rendition(video): /manifest/high/sub1.m3u8
		rendition(video): /manifest/high/sub2.m3u8


1970-01-01 00:00:00 [Media Playlist (type="")] http://foo.bar/manifest/low/main.m3u8
	segment #0 (2.009 sec): http://foo.bar/segment/low/main-01.ts
	segment #1 (2.009 sec): http://foo.bar/segment/low/main-02.ts
	segment #2 (1.003 sec): http://foo.bar/segment/low/main-03.ts

1970-01-01 00:00:00 [Segment] #0 (2.009 sec): http://foo.bar/segment/low/main-01.ts
1970-01-01 00:00:00 [Segment] #1 (2.009 sec): http://foo.bar/segment/low/main-02.ts
1970-01-01 00:00:00 [Segment] #2 (1.003 sec): http://foo.bar/segment/low/main-03.ts

1970-01-01 00:00:00 [Media Playlist (type="")] http://foo.bar/manifest/mid/main.m3u8
	segment #0 (2.009 sec): http://foo.bar/segment/mid/main-01.ts
	segment #1 (2.009 sec): http://foo.bar/segment/mid/main-02.ts
	segment #2 (1.003 sec): http://foo.bar/segment/mid/main-03.ts

1970-01-01 00:00:00 [Segment] #0 (2.009 sec): http://foo.bar/segment/mid/main-01.ts
1970-01-01 00:00:00 [Segment] #1 (2.009 sec): http://foo.bar/segment/mid/main-02.ts
1970-01-01 00:00:00 [Segment] #2 (1.003 sec): http://foo.bar/segment/mid/main-03.ts

1970-01-01 00:00:00 [Media Playlist (type="")] http://foo.bar/manifest/high/main.m3u8
	segment #0 (2.009 sec): http://foo.bar/segment/high/main-01.ts
	segment #1 (2.009 sec): http://foo.bar/segment/high/main-02.ts
	segment #2 (1.003 sec): http://foo.bar/segment/high/main-03.ts

1970-01-01 00:00:00 [Segment] #0 (2.009 sec): http://foo.bar/segment/high/main-01.ts
1970-01-01 00:00:00 [Segment] #1 (2.009 sec): http://foo.bar/segment/high/main-02.ts
1970-01-01 00:00:00 [Segment] #2 (1.003 sec): http://foo.bar/segment/high/main-03.ts
`;

  const src = new Reader();
  const logger = createLogger();
  const dest = new Writer();
  src.pipe(logger).pipe(dest)
  .on('finish', () => {
    t.is(tester.logs, expected);
    t.end();
  })
  .on('error', err => {
    t.fail(err.stack);
  });
});
