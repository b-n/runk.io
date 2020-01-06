jest.unmock('../../lib/errors')
import * as errors from '../../lib/errors'

class CustomError extends Error {}

describe('Custom Errors', () => {
  test('can throw AuthorizerError', () => {
    expect.assertions(1)
    try {
      throw new errors.AuthorizerError('testing')
    } catch (e) {
      expect(e).toBeInstanceOf(errors.AuthorizerError)
    }
  })

  test('can throw SecretError', () => {
    expect.assertions(1)
    try {
      throw new errors.SecretError('testing')
    } catch (e) {
      expect(e).toBeInstanceOf(errors.SecretError)
    }
  })
})

describe('handleHttpError', () => {
  test('skips if ok', () => {
    const response = {
      ok: true,
      json: jest.fn().mockImplementation(() => ({ message: 'OK' })),
      status: 200,
      statusText: 'OK',
    }

    return errors.handleHttpError(Error)(response)
      .then(result => {
        expect(result).toEqual(response)
      })
  })

  test('throws if not ok, with CustomError', () => {
    const responseJSON = { message: 'NOT OK' }
    const response = {
      ok: false,
      json: jest.fn().mockImplementation(() => responseJSON),
      status: 200,
      statusText: 'NOT OK',
    }

    expect.assertions(2)
    return errors.handleHttpError(CustomError)(response)
      .catch(e => {
        expect(e).toBeInstanceOf(CustomError)
        expect(e.response).toEqual(response)
      })
  })
})
