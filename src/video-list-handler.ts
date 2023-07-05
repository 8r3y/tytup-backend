import { IncomingMessage, ServerResponse } from 'http';
import { AppDataSource } from './data-source';
import { VideoInfo } from './entities/video-info';
// import { v4 as uuidV4 } from 'uuid';
import qs from 'node:querystring';

export const videoListHandler = async (
  req: IncomingMessage,
  res: ServerResponse,
  next: Function,
) => {
  const [, tag, videoId] = String(req.url).split('/');

  const { skip, take } = qs.parse(String(req.url).replace(/^.*\?/, ''));

  console.log(
    'video-list-handler works',
    qs.parse(String(req.url).replace(/^.*\?/, '')),
    { skip, take },
  );

  try {
    const [result, count] = await AppDataSource.manager
      .getRepository(VideoInfo)
      .findAndCount();

    // console.log('result', result);
    res.statusCode = 200;
    res.write(JSON.stringify({ result: { items: result, count } }));
    next();
  } catch (e) {
    console.log('Error in videoInfoHandler', e);
    res.statusCode = 200;
    res.write(JSON.stringify({ error: 'nothing' }));
    next();
  }

  // next();
};
