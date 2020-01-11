import { Response } from 'node-fetch'

class AuthorizerError extends Error {}
class SecretError extends Error {}

class NotFound extends Error {}
class BadInput extends Error {}

type Constructable<T> = new (message: string) => T

const handleHttpError = <T>(ErrorClass: Constructable<T>) => async (response: Response) => {
  if (response.ok) return response
  const error = new ErrorClass(`${response.status} ${response.statusText}`)
  throw error
}

export {
  handleHttpError,
  AuthorizerError,
  SecretError,
  NotFound,
  BadInput,
}
