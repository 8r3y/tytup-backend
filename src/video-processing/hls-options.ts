// ffmpeg options shared by the upload pipeline and the encryption demo script
export const HLS_OPTIONS = [
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
];
