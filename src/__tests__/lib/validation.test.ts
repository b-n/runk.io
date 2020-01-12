jest.unmock('../../lib/validation')
import { validateRequest } from '../../lib/validation'

import { AnySchema } from '@hapi/joi'

describe('validateRequest', () => {
  test('throws if error is present', () => {
    const obj = {
      validate: jest.fn().mockReturnValue({
        value: {
          test: 'test',
        },
        error: {
          details: [
            { message: 'Joi Error' },
          ],
        },
      }),
    } as unknown as AnySchema

    expect(() => validateRequest(null, obj, { ErrorClass: Error })).toThrow(new Error('Validate failures: Joi Error'))
  })

  test('returns validated result', () => {
    const obj = {
      validate: jest.fn().mockReturnValue({
        value: {
          test: 'test',
        },
        error: undefined,
      }),
    } as unknown as AnySchema

    expect(validateRequest(null, obj, { ErrorClass: Error })).toEqual({
      test: 'test',
    })
  })
})
