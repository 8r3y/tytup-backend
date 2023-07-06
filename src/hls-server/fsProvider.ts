import { HlsHttpRequest } from '.';

import fs from 'fs';

const fsProvider = {
  exists: (req: HlsHttpRequest, cb: (err: any, exists: any) => void) => {
    fs.exists(req.filePath, function (exists: any) {
      cb(null, exists);
    });
  },
  getSegmentStream: (
    req: HlsHttpRequest,
    cb: (err: any, readStream: fs.ReadStream) => void,
  ) => {
    cb(null, fs.createReadStream(req.filePath));
  },
  getManifestStream: (
    req: HlsHttpRequest,
    cb: (err: any, readStream: fs.ReadStream) => void,
  ) => {
    cb(null, fs.createReadStream(req.filePath));
  },
};

export default fsProvider;

