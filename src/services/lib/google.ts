import fetch from 'node-fetch'

import { getSecret } from './secrets'

const generateLoginUrl = () => {
  return `\
https://accounts.google.com/o/oauth2/v2/auth\
?client_id=${getSecret('GOOGLE_CLIENT_ID')}\
&redirect_uri=${getSecret('GOOGLE_REDIRECT_URI')}\
&response_type=code\
&scope=profile%20email\
&access_type=offline\
&prompt=consent\
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
// https://accounts.google.com/o/oauth2/v2/auth?client_id=1012747337388-aj3vrc9osip1pu1eqvn167p89loikj8f.apps.googleusercontent.com&redirect_uri=http://localhost:3000/user/token&response_type=code&scope=profile%20email&access_type=offline&prompt=consent
//
// http://localhost:3000/?code=4%2FuAFSU3R5tKNCxgIJqOIJa-C9aKPZJzS9J1_wVVe_BDBy0wsmM37iH51khFHDqIhHK31HQsX4ze2mn9S-C4RJFLs&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+openid&authuser=0&session_state=42fd264fc69cc06879cc3bc6601e28290a7d956e..b600&prompt=consent#
//

export {
  getToken,
  getUserInfo,
  generateLoginUrl,
}
