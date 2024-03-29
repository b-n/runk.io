import { AnySchema } from '@hapi/joi'

interface ValidateOptions {
  ErrorClass: any
}

export const validateRequest = (request: any, obj: AnySchema, { ErrorClass }: ValidateOptions) => {
  const { value, error } = obj.validate(
    request,
    { stripUnknown: true }
  )
  if (error !== undefined && ErrorClass !== undefined) {
    throw new ErrorClass(`Validate failures: ${error.details.map(e => e.message).join(', ')}`)
  }
  return value
}
