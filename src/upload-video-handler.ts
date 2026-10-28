import { IncomingMessage, ServerResponse } from 'http';
import { v4 as uuidV4 } from 'uuid';
import busboy from 'busboy';
import path from 'path';
import fs from 'fs';
import { addUploadToQueue } from './video-processing';
import { config } from './config';

export const uploadVideoHandler = async (
  req: IncomingMessage,
  res: ServerResponse,
  next: Function,
) => {
  console.log('uploadVideoHandler works');
  const uploadId = uuidV4();
  const createdAt = Math.floor(Date.now() / 1000);
  let name = '';
  let description = '';
  let extension = 'mp4';
  let isOk = false;

  const contentLength = Number(req.headers['content-length'] || 0);
  console.log('Content length', contentLength);

  if (contentLength > config.maxUploadSize) {
    req.statusCode = 200;
    res.end(
      JSON.stringify({
        error: `Uploaded video is too large`,
      }),
    );
    return;
  }

  try {
    const bb = busboy({ headers: req.headers, defCharset: 'utf-8' });

    const finishProcess = () => {
      addUploadToQueue({ uploadId, createdAt, name, description, extension });
      isOk = true;
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          result: `Video #${uploadId} successfully uploaded. And will be transcoding as soon as possible.`,
        }),
      );
    };

    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      console.log(
        `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
        filename,
        encoding,
        mimeType,
      );
      console.log('Info', info);

      if (name !== 'video' || !mimeType.startsWith('video/')) {
        res.statusCode = 200;
        res.end(JSON.stringify({ error: 'Video not uploaded' }));
        return;
      }

      extension = mimeType.split('/')[1];

      const saveTo = path.resolve('./raw-videos', `${uploadId}.${extension}`);
      console.log('saveTo', saveTo);

      name = filename;

      const stream = file.pipe(fs.createWriteStream(saveTo));

      stream.on('finish', () => {
        console.log('stream on finish', isOk);
        if (!isOk) {
          finishProcess();
        }
      });
    });
    bb.on('field', (fieldName, fieldValue, info) => {
      console.log(`Field [${fieldName}]: value: %j`, fieldValue);
      if (fieldName === 'description' && fieldValue.length > 0) {
        description = fieldValue;
      }

      if (fieldName === 'name' && fieldValue.length > 0) {
        name = fieldValue;
      }
    });
    bb.on('close', () => {
      console.log('Done parsing form!', isOk);
      if (!isOk) {
        finishProcess();
      }
    });
    req.pipe(bb);
    return;
  } catch (e) {
    console.log('Error in uploadVideoHandler', e);
    res.statusCode = 200;
    res.end(JSON.stringify({ error: 'Video not uploaded' }));
  }
};
