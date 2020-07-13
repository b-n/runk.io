import 'source-map-support/register'
import { Handler } from 'aws-lambda'

const league: Handler = async (event) => {
  console.log(event)
}

export const handler = league
