const config = {
  dynamodb: {},
  cors: {
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': '*.runk.nl',
  },
  tokenExpiry: '30m',
}

export default config
