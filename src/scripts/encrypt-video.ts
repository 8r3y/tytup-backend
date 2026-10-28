// Demo: transcode a video into an AES-128 encrypted HLS stream.
// Usage: npm run encrypt-video -- <input file> [video id]
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { HLS_OPTIONS } from '../video-processing/hls-options';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const [inputArg, videoId = 'encrypted-demo'] = process.argv.slice(2);

if (!inputArg) {
  console.log('Usage: npm run encrypt-video -- <input file> [video id]');
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve('./videos', videoId);
const keyPath = path.resolve(outputPath, 'enc.key');
const keyInfoPath = path.resolve(outputPath, 'enc.keyinfo');
const keyUrl = `${config.publicUrl}/streams/${videoId}/enc.key`;

fs.mkdirSync(outputPath, { recursive: true });

// Exactly 16 random bytes, written as binary
fs.writeFileSync(keyPath, crypto.randomBytes(16));

// Key info file format: key URI, local key path, IV (hex)
const iv = crypto.randomBytes(16).toString('hex');
fs.writeFileSync(keyInfoPath, [keyUrl, keyPath, iv].join('\n'));

ffmpeg(inputPath)
  .addOptions(HLS_OPTIONS)
  // Separate arguments: keeps paths with spaces intact
  .addOptions('-hls_key_info_file', keyInfoPath)
  .output(path.resolve(outputPath, 'output.m3u8'))
  .on('end', () => {
    fs.unlinkSync(keyInfoPath);
    console.log(`Done: ${config.publicUrl}/streams/${videoId}/output.m3u8`);
    console.log(`Key:  ${keyUrl}`);
  })
  .on('error', (err) => {
    fs.unlinkSync(keyInfoPath);
    console.log('encrypt-video error', err.message);
    process.exit(1);
  })
  .run();
