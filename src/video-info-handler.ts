import { IncomingMessage, ServerResponse } from 'http';
import { AppDataSource } from './data-source';
import { VideoInfo } from './entities/video-info';
// import { v4 as uuidV4 } from 'uuid';
// import qs from 'node:querystring';

export const videoInfoHandler = async (
  req: IncomingMessage,
  res: ServerResponse,
  next: Function,
) => {
  const [, tag, videoId] = String(req.url).split('/');
  console.log('video-info-handler works', videoId);

  try {
    const result = await AppDataSource.manager
      .getRepository(VideoInfo)
      .findOneOrFail({ where: { id: videoId } });

    console.log('result', result);
    res.statusCode = 200;
    res.write(JSON.stringify({ result }));
    next()
  } catch (e) {
    console.log('Error in videoInfoHandler', e);
    res.statusCode = 200;
    res.write(JSON.stringify({ error: 'nothing' }));
    next()
  }

  // next();
};
