import mkdirp from 'mkdirp'
import Knex from 'knex'
import uuidV4 from 'uuid/v4'

import * as config from './config'

const DB_DIR = config.getDbDir()
const TABLE_NAME = config.getVideoTableName()
let knex = null

const prepareCacheDir = (url, uuid) => new Promise((resolve, reject) => {
  mkdirp(DB_DIR, error => {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  })
})

export const getConnection = async () => {
  if (!knex) {
    await prepareCacheDir()
      .then(() => {
        knex = Knex({
          client: 'sqlite3',
          connection: {
            filename: DB_DIR + '/' + config.getDbFilename()
          },
          useNullAsDefault: true
        })
      })
  }

  return knex
}

export const closeConnection = async () => {
  if (knex) {
    await knex.destroy()
    knex = null;
  }
}

export const createSchema = () => {
  return getConnection()
    .then(() => {
      return knex.schema.hasTable(TABLE_NAME)
    })
    .then(exists => {
      return exists ? null : knex.schema.createTable(
        TABLE_NAME, table => {
          table.binary('uuid', 16).notNull().primary()
          table.string('url').notNull().unique()
          table.string('width')
          table.string('height')
          table.string('duration')
        }
      )
    })
    .catch(error => {
      console.error('Schema creation error', error)
      process.exit(1)
    })
}

export const determineUuid = (url) => {
  return getConnection()
    .then(() => {
      return knex.select(['uuid']).from(TABLE_NAME).where('url', url)
    })
    .then(rows => {
      if (rows && rows.length === 1) {
        console.log('Existing video: ' + url)

        return rows[0].uuid
      } else {
        console.log('New video: ' + url)

        const uuid = uuidV4()

        return knex(TABLE_NAME).insert({url, uuid})
          .then(() => {
            return uuid
          })
      }
    })
    .then(uuid => {
      return uuid
    })
    .catch(error => {
      console.error('Cache lookup error', error)
      process.exit(1)
    })
}

export const getVideoInfo = (uuid) => {
  return getConnection()
    .then(() => {
      return knex.select(['width', 'height', 'duration']).from(TABLE_NAME).where('uuid', uuid)
    })
    .then(rows => {
      if (rows && rows.length === 1) {
        return rows[0]
      } else {
        return null
      }
    })
    .catch(error => {
      console.error('Cache access error', error)
      process.exit(1)
    })
}

export const updateVideoInfo = (uuid, info) => {
  return getConnection()
    .then(() => {
      return knex(TABLE_NAME).where('uuid', uuid).update({
        width: info.width || null,
        height: info.height || null,
        duration: info.duration || null
      })
    })
    .catch(error => {
      console.error('Cache update error', error)
      process.exit(1)
    })
}
