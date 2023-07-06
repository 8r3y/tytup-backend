import { AppDataSource } from '../data-source';
import { VideoInfo } from '../entities/video-info';

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const addUploadToQueue = ({
  uploadId,
  createdAt,
  name,
  description,
  extension
}: {
  uploadId: string;
  name: string;
  createdAt: number;
  description: string;
  extension: string;
}) => {
  const outputPath = path.resolve('./videos', `${uploadId}`);
  const screenshotPath = path.resolve('./previews');
  const inputPath = path.resolve('./raw-videos', `${uploadId}.${extension}`);
  console.log('addUploadToQueue', {
    path: ffmpegInstaller.path,
    uploadId,
    name,
    outputPath,
  });
  fs.mkdirSync(outputPath);
  try {
    const startTime = Date.now();
    ffmpeg(inputPath)
      .addOptions([
        '-acodec copy',
        '-profile:v baseline',
        '-level 3.0',
        '-s 1920x1080',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-c:a aac',
        '-strict -2',
        `-f hls`,
      ])
      .output(path.resolve(outputPath, 'output.m3u8'))
      .on('end', (event) => {
        console.log(
          'End event with',
          (Date.now() - startTime) / 1000,
          'seconds',
        );

        const videoInfo = new VideoInfo();
        videoInfo.id = uploadId;
        videoInfo.createdAt = createdAt;
        videoInfo.author = 'Andy Petrosov';
        videoInfo.duration = 'N/A';
        videoInfo.views = 'N/A';
        videoInfo.name = name;
        videoInfo.description = description;
        videoInfo.url = `https://prayers.nsstms.ru/videos/${uploadId}/output.m3u8`;
        videoInfo.preview = `https://prayers.nsstms.ru/previews/${uploadId}.jpg`;

        ffmpeg(inputPath)
          .addOptions(['-ss 00:00:10', '-frames:v 1', '-q:v 2'])
          .output(path.resolve(screenshotPath, `${uploadId}.jpg`))
          .run();

        AppDataSource.manager.save(videoInfo);
      })
      .run();
  } catch (e) {
    console.log('addUploadToQueue error', e);
  }
};
