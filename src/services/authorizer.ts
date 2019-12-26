import addSeconds from 'date-fns/addSeconds'

import { sign, verify, generatePolicy } from './lib/auth'

import * as google from './lib/google'

const generateLoginUrls = () => ({
  google: google.generateLoginUrl(),
})

const checkAuthCallback = async (params: Record<string, any>, type: string): Promise<AuthResult> => {
  if (type !== 'GOOGLE') {
    throw new Error('Invalid authorizer')
  }

  const {
    access_token,
    expires_in,
    refresh_token,
    token_type,
  } = await google.getToken(params.code)

  const { id, email, name, locale, picture } = await google.getUserInfo(access_token)

  return Promise.resolve({
    authorizer: type,
    id,
    name,
    email,
    locale,
    pictureURL: picture,
    accessToken: access_token,
    refreshToken: refresh_token,
    tokenType: token_type,
    expiresIn: expires_in,
  })
}

const getUserAuthorizerFromAuthResult = ({
  id,
  accessToken,
  refreshToken,
  tokenType,
  expiresIn,
}: AuthResult): UserAuthorizer => ({
  id,
  accessToken,
  refreshToken,
  tokenType,
  retrievedDate: new Date().toISOString(),
  expires: addSeconds(new Date(), expiresIn).toISOString(),
})

export {
  checkAuthCallback,
  sign,
  verify,
  generatePolicy,
  generateLoginUrls,
  getUserAuthorizerFromAuthResult,
}
