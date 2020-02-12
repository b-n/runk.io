import fetch from 'node-fetch'

import { Login } from './auth'
import { handleHttpError, AuthorizerError } from './errors'

import { getSecret } from './secrets'

const getName = (): string => 'GOOGLE'

const generateLoginUrl = (): Login => ({
  url: 'https://accounts.google.com/o/oauth2/v2/auth',
  parameters: {
    client_id: getSecret('GOOGLE_CLIENT_ID'),
    response_type: 'code',
    scope: 'profile%20email',
    access_type: 'offline',
    prompt: 'consent',
    state: 'GOOGLE',
  },
})

const getToken = async (code: string, redirect_uri: string) => {
  const clientId = getSecret('GOOGLE_CLIENT_ID')
  const clientSecret = getSecret('GOOGLE_CLIENT_SECRET')

  const body = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri,
  }

  return fetch(
    'https://www.googleapis.com/oauth2/v4/token',
    {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }
  )
    .then(handleHttpError(AuthorizerError))
    .then(response => response.json())
}

const getUserInfo = async (token_type: string, access_token: string) => {
  return fetch(
    'https://www.googleapis.com/userinfo/v2/me',
    {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
      method: 'GET',
    }
  )
    .then(handleHttpError(AuthorizerError))
    .then(response => response.json())
}

const checkAuthCode = async (code: string, redirect_uri: string): Promise<AuthResult> => {
  const {
    access_token,
    token_type,
  } = await getToken(code, redirect_uri)

  const { id, email, name, locale, picture } = await getUserInfo(token_type, access_token)

  return Promise.resolve({
    authorizer: 'GOOGLE',
    id,
    name,
    email,
    locale,
    pictureURL: picture,
  })
}

export {
  getName,
  getToken,
  getUserInfo,
  checkAuthCode,
  generateLoginUrl,
}
