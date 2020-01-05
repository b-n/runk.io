import { SecretError } from './errors'

const getSecret = (key: string) => {
  if (!process.env[key]) {
    throw new SecretError(`Cannot find secret with key: ${key}`)
  }
  return process.env[key]
}

export {
  getSecret,
}
