import { IncomingMessage, ServerResponse } from 'http';
import { v4 as uuidV4 } from 'uuid';
import busboy from 'busboy';
import path from 'path';
import fs from 'fs';
import { addUploadToQueue } from './video-processing';

export const uploadVideoHandler = async (
  req: IncomingMessage,
  res: ServerResponse,
  next: Function,
) => {
  console.log('uploadVideoHandler works');
  const uploadId = uuidV4();
  const createdAt = Math.floor(Date.now() / 1000);
  let name = '';
  let isOk = false;

  try {
    const bb = busboy({ headers: req.headers });
    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      console.log(
        `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
        filename,
        encoding,
        mimeType,
      );

      if (name !== 'video' || mimeType !== 'video/mp4') {
        res.statusCode = 200;
        res.end(JSON.stringify({ error: 'Video not uploaded' }));
        return;
      }

      const saveTo = path.resolve('./raw-videos', `${uploadId}.mp4`);
      console.log('saveTo', saveTo);

      name = filename;

      const stream = file.pipe(fs.createWriteStream(saveTo));

      stream.on('finish', () => {
        console.log('stream on finish', isOk);
        res.statusCode = 200;
        if (isOk) {
          addUploadToQueue({ uploadId, createdAt, name });
          res.end(
            JSON.stringify({
              result: `Video #${uploadId} successfully uploaded. And will be transcoding as soon as possible.`,
            }),
          );
        } else {
          res.end(JSON.stringify({ error: 'Not isOk' }));
        }
      });
    });
    // bb.on('field', (name, val, info) => {
    //   console.log(`Field [${name}]: value: %j`, val);
    // });
    bb.on('close', () => {
      console.log('Done parsing form!', isOk);
      isOk = true;
    });
    req.pipe(bb);
    return;
  } catch (e) {
    console.log('Error in uploadVideoHandler', e);
    res.statusCode = 200;
    res.end(JSON.stringify({ error: 'Video not uploaded' }));
  }
};
