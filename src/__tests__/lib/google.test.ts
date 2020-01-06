jest.unmock('../../lib/google')
jest.unmock('../../lib/errors')
import {
  getName,
  getToken,
  getUserInfo,
  checkAuthCode,
  generateLoginUrl,
} from '../../lib/google'

import { AuthorizerError } from '../../lib/errors'

import * as secrets from '../../lib/secrets'
import fetch from 'node-fetch'

const spies = {
  getSecret: jest.spyOn(secrets, 'getSecret'),
  fetch: jest.spyOn(fetch, 'default'),
}

test('getName - gets google', () => {
  expect(getName()).toEqual('GOOGLE')
})

test('generateLoginUrl - generates a login url', () => {
  spies.getSecret.mockImplementation(() => 'testing')
  expect(generateLoginUrl()).toEqual('https://accounts.google.com/o/oauth2/v2/auth?client_id=testing&redirect_uri=testing&response_type=code&scope=profile%20email&access_type=offline&prompt=consent&state=GOOGLE')
  expect(spies.getSecret).toHaveBeenCalledTimes(2)
  expect(spies.getSecret).toHaveBeenCalledWith('GOOGLE_CLIENT_ID')
  expect(spies.getSecret).toHaveBeenCalledWith('GOOGLE_REDIRECT_URL')
})

describe('getToken', () => {
  test('Error: fails with AuthorizerError', () => {
    const response = {
      ok: false,
      status: 400,
      statusText: 'BadInput',
    }
    spies.fetch.mockImplementation(() => Promise.resolve(response))
    expect(getToken('123')).rejects.toThrow(AuthorizerError)
  })

  test('success: gives some json back', () => {
    const responseJSON = { message: 'OK' }
    const response = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => responseJSON,
    }
    spies.fetch.mockImplementation(() => Promise.resolve(response))

    expect(getToken('123')).resolves.toEqual(responseJSON)
    expect(spies.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          code: '123',
          client_id: 'testing',
          client_secret: 'testing',
          grant_type: 'authorization_code',
          redirect_uri: 'testing',
        }),
      })
    )
  })
})

describe('getUserInfo', () => {
  test('Error: fails with AuthorizerError', () => {
    const response = {
      ok: false,
      status: 400,
      statusText: 'BadInput',
    }
    spies.fetch.mockImplementation(() => Promise.resolve(response))
    expect(getUserInfo('Bearer', '123')).rejects.toThrow(AuthorizerError)
  })

  test('success: gives some json back', () => {
    const responseJSON = { message: 'OK' }
    const response = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => responseJSON,
    }
    spies.fetch.mockImplementation(() => Promise.resolve(response))
    expect(getUserInfo('Bearer', '123')).resolves.toEqual(responseJSON)
    expect(spies.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer 123',
        },
      })
    )
  })
})

test('checkAuthCode - gives all details', () => {
  const responseJSON = {
    access_token: '123',
    token_type: '234',
    id: '345',
    name: 'testing',
    email: 'testing@example.com',
    locale: 'en-NZ',
    picture: 'https://picsum.photos/200',
  }
  const response = {
    ok: true,
    json: () => responseJSON,
  }
  spies.fetch.mockImplementation(() => Promise.resolve(response))

  expect(checkAuthCode('123')).resolves.toEqual({
    authorizer: 'GOOGLE',
    id: responseJSON.id,
    email: responseJSON.email,
    name: responseJSON.name,
    locale: responseJSON.locale,
    pictureURL: responseJSON.picture,
  })
})
