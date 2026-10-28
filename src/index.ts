import http, { IncomingMessage, ServerResponse } from 'http';
import httpAttach from 'http-attach';
import 'reflect-metadata';

import { videoInfoHandler } from './video-info-handler';
import { AppDataSource } from './data-source';
import { videoListHandler } from './video-list-handler';
import { uploadVideoHandler } from './upload-video-handler';
import { HLSServer } from './hls-server';
import { config } from './config';

const server = http.createServer();

const hls = new HLSServer(server, {
  path: '/streams', // Base URI to output HLS streams
  dir: 'videos', // Directory that input files are stored
});

console.log('HLS', hls);

const { port, hostname } = config;

const listVideosMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: Function,
) => {
  console.log('listVideosMiddleware worked', req.url);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (String(req.url).startsWith('/video-info')) {
    videoInfoHandler(req, res, next);
  } else if (String(req.url).startsWith('/video-list')) {
    videoListHandler(req, res, next);
  } else if (String(req.url).startsWith('/upload-video')) {
    uploadVideoHandler(req, res, next);
  } else {
    next();
  }
};

httpAttach(server, listVideosMiddleware);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  AppDataSource.initialize()
    .then()
    .catch((err) => console.log('AppDataSource Error', err));
});
