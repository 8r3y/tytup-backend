import { AppDataSource } from '../data-source';
import { VideoInfo } from '../entities/video-info';

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { HLS_OPTIONS } from './hls-options';

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
      .addOptions(HLS_OPTIONS)
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
        videoInfo.author = config.defaultAuthor;
        videoInfo.duration = 'N/A';
        videoInfo.views = 'N/A';
        videoInfo.name = name;
        videoInfo.description = description;
        videoInfo.url = `${config.publicUrl}/videos/${uploadId}/output.m3u8`;
        videoInfo.preview = `${config.publicUrl}/previews/${uploadId}.jpg`;

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
