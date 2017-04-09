import uuidV4 from 'uuid/v4'
import * as Ffmpeg from 'fluent-ffmpeg'

import * as config from './src/config'
import * as db from './src/db'
import * as downloader from './src/downloader'
import * as util from './src/util'

const main = async () => {
  if (!process.argv || process.argv.length <= 3) {
    console.error('Syntax: ' + __filename + ' <url1> <url2> [url3] [url4] [...]')
  } else {
    const args = process.argv.slice(2)
    const videos = []
    let longestLength = 0
    let largestWidth = 0
    let largestHeight = 0

    await db.createSchema()

    for (let i = 0; i < args.length; i++) {
      const url = args[i]
      const uuid = await db.determineUuid(url)
      let videoInfo = await db.getVideoInfo(uuid)

      if (!videoInfo || !videoInfo.duration || !videoInfo.width || !videoInfo.height) {
        videoInfo = await downloader.retrieveVideo(url, uuid)

        if (videoInfo && videoInfo.duration && videoInfo.width && videoInfo.height) {
          await db.updateVideoInfo(uuid, videoInfo)
        } else {
          videoInfo = null
        }
      }

      if (!videoInfo) {
        console.error('No duration / dimension info for uuid: ' + uuid)
        process.exit(1)
      } else {
        let {width, height, duration} = videoInfo
        let length = util.durationToSeconds(duration)
        let widthInt = parseInt(width, 10)
        let heightInt = parseInt(height, 10)

        videos.push({ uuid, url, length, width: widthInt, height: heightInt })

        if (length > longestLength) {
          longestLength = length
        }

        if (widthInt > largestWidth) {
          largestWidth = widthInt
        }

        if (heightInt > largestHeight) {
          largestHeight = heightInt
        }
      }
    }

    await db.closeConnection()

    videos.sort((videoA, videoB) => {
      return videoB.length - videoA.length
    })

    console.log('Longest length: ' + longestLength)
    console.log('Largest width: ' + largestWidth)
    console.log('Largest height: ' + largestHeight)
    console.log('Videos', videos)

    const outputFile = __dirname + '/' + uuidV4() + '.mp4'
    const ffmpeg = Ffmpeg.default({
      logger: {
        debug: (msg) => console.log('DEBUG: ' + msg),
        info: (msg) => console.log('INFO: ' + msg),
        warn: (msg) => console.log('WARN: ' + msg),
        error: (msg) => console.error('ERROR: ' + msg)
      }
    })

    ffmpeg.on('error', error => {
      console.error('Ffmpeg error', error)
      process.exit(1)
    })

    ffmpeg.on('progress', (i) => {
      console.log('Ffmpeg progress: ' + Math.floor(i.percent) + '%');
    })

    ffmpeg.on('end', error => {
      console.log('Ffmpeg done')
    })

    const rowCount = Math.floor(videos.length / 2) + ((videos.length % 2) ? 1 : 0)
    const rowWidth = largestWidth
    const columnWidth = Math.floor(rowWidth / 2)
    const rowHeight = Math.floor(largestHeight / rowCount)
    console.log('Rows: ' + rowCount + ', width: ' + rowWidth + ', height: ' + rowHeight + ', column height: ' + columnWidth)
    let currentRow = 0
    let isLeftFrame = false
    const filterInputs = []
    const filterOutputs = []

    for (let i = 0; i < videos.length; i++) {
      isLeftFrame = !isLeftFrame

      if (isLeftFrame) {
        currentRow++
      }

      const currentVideo = videos[i]
      const previousVideo = (i === 0 ? null : videos[i - 1])
      const nextVideo = (i === (videos.length + 1)) ? null : videos[i + 1]
      const videoDir = config.getVideoDir(currentVideo.url, currentVideo.uuid)
      const videoFile = videoDir + '/' + config.getVideoFileName(currentVideo.url, currentVideo.uuid)
      const streamName = ('row' + currentRow + (isLeftFrame ? 'left' : 'right'))
      const hackyWidth = ((!isLeftFrame || nextVideo) ? Math.floor(rowWidth / 2) : rowWidth)
      const xOffset = (isLeftFrame ? null : ('x=' + hackyWidth))
      const yOffset = (currentRow === 1 ? null : ('y=' + Math.floor((currentRow - 1) * rowHeight)))
      const overlayCoords = (
        (!xOffset && !yOffset) ?
          ''
          :
          '=' +
            (xOffset ? xOffset : '') +
            (yOffset ? ((xOffset ? ':' : '') + yOffset) : '')
      )

      console.log('Index (' + i + ') is ' + (isLeftFrame ? 'left' : 'right') + ' frame of row: ' + currentRow + ' - ' + currentVideo.url)

      filterInputs.push('[' + i + ':v] setpts=PTS-STARTPTS, scale=' + ((nextVideo || !isLeftFrame) ? columnWidth : rowWidth) + 'x' + rowHeight + ' [' + streamName + ']')
      filterOutputs.push('[' + (i === 0 ? 'base' : ('tmp' + i)) + '][' + streamName + '] overlay' + overlayCoords + (nextVideo ? (' [tmp' + (i+1) + ']') : ''))
      ffmpeg.input(videoFile)
    }

    const filters = [
      'nullsrc=size=' + largestWidth + 'x' + largestHeight + ' [base]',
      ...filterInputs,
      ...filterOutputs
    ]

    console.log('Complex filters', filters)
    ffmpeg.complexFilter(filters)
    ffmpeg.audioCodec('aac')
    ffmpeg.videoCodec('libx264')
    ffmpeg.outputOptions(['-preset ultrafast', '-shortest'])
    ffmpeg.output(outputFile).run()
  }
}

main()
