import dotenv from 'dotenv'

dotenv.config({ silent: true })

export default {
  get: (key) => {
    return process.env[key]
  }
}
