import { IncomingMessage, ServerResponse } from 'http';
import { v4 as uuidV4 } from 'uuid';
import busboy from 'busboy';
import path from 'path';
import fs from 'fs';

export const uploadVideoHandler = async (
  req: IncomingMessage,
  res: ServerResponse,
  next: Function,
) => {
  console.log('uploadVideoHandler works');

  const bb = busboy({ headers: req.headers });
  bb.on('file', (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    console.log(
      `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
      filename,
      encoding,
      mimeType,
    );

    if (mimeType !== 'video/mp4') {
      res.statusCode = 200;
      res.end(JSON.stringify({ error: 'Video not uploaded' }));
      return;
    }

    const saveTo = path.resolve(
      './raw-videos',
      `busboy-upload-${uuidV4()}.mp4`,
    );
    console.log('saveTo', saveTo);

    file.pipe(fs.createWriteStream(saveTo));
  });
  // bb.on('field', (name, val, info) => {
  //   console.log(`Field [${name}]: value: %j`, val);
  // });
  bb.on('close', () => {
    console.log('Done parsing form!');
    res.statusCode = 200;
    res.end(JSON.stringify({ result: 'Ok' }));
  });
  req.pipe(bb);
  return;
};
