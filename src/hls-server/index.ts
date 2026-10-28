const url = require('url');
const path = require('path');
const zlib = require('zlib');
import httpAttach from 'http-attach';
import http from 'http';
import fsProvider from './fsProvider';

let CONTENT_TYPE = {
  MANIFEST: 'application/vnd.apple.mpegurl',
  SEGMENT: 'video/MP2T',
  KEY: 'application/octet-stream',
  HTML: 'text/html',
};

export type HlsHttpRequest = http.IncomingMessage & {
  filePath: string;
  extension: string;
  acceptsCompression: boolean;
};

export class HLSServer {
  path?: string = undefined;
  dir?: string = undefined;

  provider = fsProvider;

  constructor(server: http.Server, opts: { path: string; dir: string }) {
    this.path = opts.path;
    this.dir = opts.dir;

    httpAttach(server, this._middleware.bind(this));
  }

  _middleware = (
    req: HlsHttpRequest,
    res: http.ServerResponse,
    next: Function,
  ) => {
    let self = this;

    let uri = url.parse(req.url).pathname;
    let relativePath = path.relative(this.path, uri);
    let filePath = path.join(this.dir, relativePath);

    // Do not serve anything outside of the streams directory (path traversal)
    if (
      relativePath.startsWith('..') ||
      path.isAbsolute(relativePath) ||
      !path.resolve(filePath).startsWith(path.resolve(this.dir!) + path.sep)
    ) {
      return next();
    }

    req.extension = path.extname(filePath);
    
    // console.log('_middleware', {
    //   uri,
    //   relativePath,
    //   filePath,
    //   extension: req.extension,
    // });

    req.filePath = filePath;

    // Gzip support
    let ae = (req.headers['accept-encoding'] || '') as string;

    req.acceptsCompression = !!ae.match(/\bgzip\b/);

    this.provider.exists(req, (err, exists) => {
      if (err) {
        res.statusCode = 500;
        res.end();
      } else if (!exists) {
        res.statusCode = 404;
        res.end();
      } else {
        switch (req.extension) {
          case '.m3u8':
            self._writeManifest(req, res, next);
            break;

          case '.ts':
            self._writeSegment(req, res, next);
            break;

          case '.key':
            self._writeEncKey(req, res, next);
            break;

          case '.jpg':
            self._writePreview(req, res, next);
            break;

          default:
            next();
            break;
        }
      }
    });
  };

  _writeManifest = (
    req: HlsHttpRequest,
    res: http.ServerResponse,
    next: Function,
  ) => {
    let self = this;

    self.provider.getManifestStream(req, function (err, stream) {
      if (err) {
        res.statusCode = 500;
        res.end();

        return next();
      }

      res.setHeader('Content-Type', CONTENT_TYPE.MANIFEST);
      res.statusCode = 200;

      if (req.acceptsCompression) {
        res.setHeader('content-encoding', 'gzip');
        res.statusCode = 200;
        let gzip = zlib.createGzip();

        stream.pipe(gzip).pipe(res);
      } else {
        stream.pipe(res).setDefaultEncoding('utf-8');
      }
    });
  };

  _writeSegment = (
    req: HlsHttpRequest,
    res: http.ServerResponse,
    next: Function,
  ) => {
    let self = this;

    self.provider.getSegmentStream(req, function (err, stream) {
      if (err) {
        res.statusCode = 500;
        res.end();

        return;
      }
      res.setHeader('Content-Type', CONTENT_TYPE.SEGMENT);
      res.statusCode = 200;
      stream.pipe(res);
    });
  };

  _writeEncKey = (
    req: HlsHttpRequest,
    res: http.ServerResponse,
    next: Function,
  ) => {
    let self = this;

    self.provider.getManifestStream(req, function (err, stream) {
      if (err) {
        res.statusCode = 500;
        res.end();

        return next();
      }

      // Demo: the key is served to anyone, see "Шифрование HLS" in README
      res.setHeader('Content-Type', CONTENT_TYPE.KEY);
      res.statusCode = 200;
      stream.pipe(res);
    });
  };

  _writePreview = (
    req: HlsHttpRequest,
    res: http.ServerResponse,
    next: Function,
  ) => {
    let self = this;

    self.provider.getManifestStream(req, function (err, stream) {
      if (err) {
        res.statusCode = 500;
        res.end();

        return next();
      }

      res.setHeader('Content-Type', 'image/jpeg');
      res.statusCode = 200;

      if (req.acceptsCompression) {
        res.setHeader('content-encoding', 'gzip');
        res.statusCode = 200;
        let gzip = zlib.createGzip();

        stream.pipe(gzip).pipe(res);
      } else {
        stream.pipe(res);
      }
    });
  };
}

