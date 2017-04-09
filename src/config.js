import dotenv from 'dotenv'

dotenv.config({ silent: true })

export const get = (key) => process.env[key]

export const getCacheDir = () => {
  return get('CACHE_DIR') || (__dirname + '/../cache')
}

export const getDbDir = getCacheDir

export const getDbFilename = () => {
  return get('DB_FILENAME') || 'data.sqlite'
}

export const getVideoTableName = () => {
  return get('VIDEO_TABLE') || 'videos'
}

export const getVideoDir = (url, uuid) => {
  return getCacheDir() + '/' + uuid
}

export const getVideoFileName = (url, uuid) => {
  return 'output.mp4'
}
