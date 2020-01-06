jest.unmock('../../lib/auth')
jest.unmock('jsonwebtoken')
import { verify, sign } from '../../lib/auth'

test('auth: can verify and sign stuff', () => {
  const input = {
    you: 'spin me right round baby right round',
  }

  const token = sign(input, { expiresIn: 100 })

  const output = verify(token)

  expect(output).toEqual(expect.objectContaining({
    ...input,
  }))
})
