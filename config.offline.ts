import { Context } from 'aws-lambda'

const config = {
  dynamodb: {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'DEFAULT_ACCESS_KEY',
    secretAccessKey: 'DEFAULT_SECRET',
  },
  cors: {
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': '*',
  },
  sqs: {
    region: 'localhost',
    endpoint: 'http://localhost:9324',
    accessKeyId: 'root',
    secretAccessKey: 'root',
  },
  sqsUrl: (_: Context) => 'http://localhost:9324/queue',
  tokenExpiry: 86400,
}

export default config
