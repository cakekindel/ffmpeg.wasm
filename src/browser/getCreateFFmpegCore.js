/* eslint-disable no-undef */
// const resolveURL = require('resolve-url');
const { log } = require('../utils/log');

const tap = action => v => {action(); return v;}

/*
 * Fetch data from remote URL and convert to blob URL
 * to avoid CORS issue
 */
const toBlobURL = async (url, mimeType) => {
  const logFileSize = tap(buf => log('info', `${url} file size = ${buf.byteLength} bytes`));
  const logBlobUrl = tap(url => log('info', `${url} blob URL = ${blobURL}`));
  const bufToBlob = buf => new Blob([buf], { type: mimeType });
 
  log('info', `fetch ${url}`);

  return fetch(url, {mode: 'no-cors'})
    .then(resp => resp.arrayBuffer())
    .then(logFileSize)
    .then(bufToBlob)
    .then(URL.createObjectURL)
    .then(logBlobUrl);
};

module.exports = async ({ corePath: coreRemotePath }) => {
  if (typeof coreRemotePath !== 'string') {
    throw Error('corePath should be a string!');
  }
  // const coreRemotePath = resolveURL(_corePath);
  const corePath = await toBlobURL(
    coreRemotePath,
    'application/javascript',
  );
  const wasmPath = await toBlobURL(
    coreRemotePath.replace('ffmpeg-core.js', 'ffmpeg-core.wasm'),
    'application/wasm',
  );
  const workerPath = await toBlobURL(
    coreRemotePath.replace('ffmpeg-core.js', 'ffmpeg-core.worker.js'),
    'application/javascript',
  );
  if (typeof createFFmpegCore === 'undefined') {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      const eventHandler = () => {
        script.removeEventListener('load', eventHandler);
        log('info', 'ffmpeg-core.js script loaded');
        resolve({
          createFFmpegCore,
          corePath,
          wasmPath,
          workerPath,
        });
      };
      script.src = corePath;
      script.type = 'text/javascript';
      script.addEventListener('load', eventHandler);
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  }
  log('info', 'ffmpeg-core.js script is loaded already');
  return Promise.resolve({
    createFFmpegCore,
    corePath,
    wasmPath,
    workerPath,
  });
};
