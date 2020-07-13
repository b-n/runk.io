import { Context } from 'aws-lambda'

const config = {
  dynamodb: {},
  cors: {
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': 'https://runk.nl',
  },
  sqs: {},
  sqsUrl: (_: Context) => 'http://localhost:9324/queue',
  tokenExpiry: 2400,
}

export default config
