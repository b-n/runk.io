import { SecretError } from '../errors'

// load from SSM
import secrets from '../../../secrets.json'

const getSecret = (key: string) => {
  if (!secrets[key]) {
    throw new SecretError(`Cannot find secret with key: ${key}`)
  }
  return secrets[key]
}

export {
  getSecret,
}
