import mkdirp from 'mkdirp'
import * as fs from 'fs'
import youtubeDl from 'youtube-dl'

import * as config from './config'

const prepareVideoCache = (url, uuid) => new Promise((resolve, reject) => {
  const videoDir = config.getVideoDir(url, uuid)
  const videoFile = videoDir + '/' + config.getVideoFileName(url, uuid)

  mkdirp(videoDir, error => {
    if (error) {
      reject(error)
    } else {
      fs.stat(videoFile, (error, stat) => {
        resolve({
          videoDir,
          videoFile,
          bytesDownloaded: (stat && stat.size) ? stat.size : 0
        })
      })
    }
  })
})

export const retrieveVideo = (url, uuid) => new Promise((resolve, reject) => {
  let videoInfo = null

  prepareVideoCache(url, uuid)
    .then(({videoDir, videoFile, bytesDownloaded}) => {
      const download = youtubeDl(
        url,
        ['--format=best'],
        {
          start: bytesDownloaded,
          cwd: videoDir
        }
      )

      download.on('info', info => {
        console.log('Starting at byte: ' + bytesDownloaded + ' of url: ' + url)

        videoInfo = info
      })
      download.on('end', () => {
        console.log('Finished downloading: ' + url)
        resolve(videoInfo)
      })
      download.on('error', (error) => reject(error))
      download.pipe(fs.createWriteStream(videoFile, { flags: 'a' }))
    })
    .catch(error => reject(error))
})
