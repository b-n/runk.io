jest.unmock('../../lib/secrets')
jest.unmock('../../lib/errors')
import { getSecret } from '../../lib/secrets'

import { SecretError } from '../../lib/errors'

describe('getSecret', () => {
  test('gets valid key', () => {
    process.env.someKey = 'testing'

    expect(getSecret('someKey')).toEqual('testing')
  })

  test('throws if key/value doesn\'t exist', () => {
    process.env.someKey = ''

    expect(() => getSecret('someKey')).toThrow(SecretError)
    expect(() => getSecret('NotEvenAKey')).toThrow(SecretError)
  })
})
