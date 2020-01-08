class AuthorizerError extends Error {}
class SecretError extends Error {}

class NotFound extends Error {}
class BadInput extends Error {}

const handleHttpError = (ErrorClass) => async (response) => {
  if (response.ok) return response
  const error = new ErrorClass(`${response.status} ${response.statusText}`)
  error.response = response
  throw error
}

export {
  handleHttpError,
  AuthorizerError,
  SecretError,
  NotFound,
  BadInput,
}
