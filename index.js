import * as db from './src/db'
import * as downloader from './src/downloader'

const main = async () => {
  if (!process.argv || process.argv.length <= 3) {
    console.error('Syntax: ' + __filename + ' <url1> <url2> [url3] [url4] [...]')
  } else {
    const args = process.argv.slice(2)

    await db.createSchema()

    for(let i = 0; i < args.length; i++) {
      const url = args[i]
      const uuid = await db.determineUuid(url)
      const {width, height, duration} = await db.getVideoInfo(uuid)

      if (!width || !height || !duration) {
        const videoInfo = await downloader.retrieveVideo(url, uuid)

        await db.updateVideoInfo(uuid, videoInfo)
      }
    }

    await db.closeConnection()
  }
}

main()
