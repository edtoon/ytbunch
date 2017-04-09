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
        console.error('No duration / dimension info for uuid: ' + uuid + ', skipping')
      } else {
        let {width, height, duration} = videoInfo
        let length = util.durationToSeconds(duration)
        let widthInt = parseInt(width, 10)
        let heightInt = parseInt(height, 10)

        videos.push({ uuid, url, length })

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
  }
}

main()
