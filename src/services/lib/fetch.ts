export const handleErrors = (ErrorClass) => async (response) => {
  if (response.ok) return response
  const body = await response.json()
  throw new ErrorClass(`${response.status} ${response.statusText}. Body: ${body}`)
}
