class AuthorizerError extends Error {}
class SecretError extends Error {}

const handleHttpError = (ErrorClass) => async (response) => {
  if (response.ok) return response
  const body = await response.json()
  throw new ErrorClass(`${response.status} ${response.statusText}. Body: ${body}`)
}

export {
  handleHttpError,
  AuthorizerError,
  SecretError,
}
