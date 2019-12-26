import fetch from 'node-fetch'

import { getSecret } from './secrets'

const getName = (): string => 'GOOGLE'

const generateLoginUrl = () => {
  return `\
https://accounts.google.com/o/oauth2/v2/auth\
?client_id=${getSecret('GOOGLE_CLIENT_ID')}\
&redirect_uri=${getSecret('GOOGLE_REDIRECT_URI')}\
&response_type=code\
&scope=profile%20email\
&access_type=offline\
&prompt=consent\
&state=GOOGLE\
`
}

const getToken = async (code: string) => {
  const clientId = getSecret('GOOGLE_CLIENT_ID')
  const clientSecret = getSecret('GOOGLE_CLIENT_SECRET')
  const redirectUri = getSecret('GOOGLE_REDIRECT_URI')

  const body = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
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
    .then(response => response.json())
}

const getUserInfo = async (access_token: string) => {
  return fetch(
    'https://www.googleapis.com/userinfo/v2/me',
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      method: 'GET',
    }
  )
    .then(response => response.json())
}

const checkAuthCode = async (code: string): Promise<AuthResult> => {
  const {
    access_token,
    expires_in,
    refresh_token,
    token_type,
  } = await getToken(code)

  const { id, email, name, locale, picture } = await getUserInfo(access_token)

  return Promise.resolve({
    authorizer: 'GOOGLE',
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

export {
  getName,
  checkAuthCode,
  generateLoginUrl,
}
