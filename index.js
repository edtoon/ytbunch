import config from './src/config'
import * as fs from 'fs'
import Knex from 'knex'
import uuidV4 from 'uuid/v4'
import rimraf from 'rimraf'
import YTDL from 'node-youtube-dl'

const main = async () => {
  if (!process.argv || process.argv.length <= 3) {
    console.log('Syntax: ' + __filename + ' <url1> <url2> [url3] [url4] [...]')
  } else {
    const cacheDir = config.get('CACHE_DIR') || (__dirname + '/cache')
    const args = process.argv.slice(2)

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir)
    }

    const knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: cacheDir + '/data.sqlite'
      },
      useNullAsDefault: true
    })

    await knex.schema.hasTable('videos')
      .then(exists => {
        if (!exists) {
          knex.schema.createTable(
            'videos', (table) => {
              table.binary('uuid', 16).notNull().primary()
              table.string('url').notNull().unique()
            }
          )
            .catch(error => {
              console.log('Table creation error', error)
              process.exit(1)
            })
        }
      })
      .catch(error => {
        console.log('Cache setup error', error)
        process.exit(1)
      })

    for(let i = 0; i < args.length; i++) {
      const url = args[i]
      let uuid = null

      await knex.select(['uuid']).from('videos').where('url', url)
        .then(rows => {
          if (rows && rows.length === 1) {
            uuid = rows[0].uuid

            console.log('Existing video: ' + url)
          } else {
            uuid = uuidV4()

            knex('videos').insert({url, uuid})
              .then(() => {
                console.log('New video: ' + url)
              })
          }

          return uuid
        })


      const videoDir = cacheDir + '/' + uuid

      if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir)

        await YTDL.download(url, 'best')
          .then(stream => {
            stream.pipe(fs.createWriteStream(videoDir + '/output.mp4'))
          })
          .catch(error => {
            console.log('Error downloading url: ' + url, error)
            rimraf(videoDir, () => {
              process.exit(-1)
            })
          })
      }
    }

    knex.destroy()
  }
}

main()
