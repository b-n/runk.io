import 'source-map-support/register'

import { NotFound, BadInput } from '../lib/errors'
import { withMiddleware, Handler } from '../lib/middleware'

import { getById, recalculate } from '../repositories/league'

import { getQueueUrl, sendMessage } from '../lib/sqs'

const league: Handler = async (event, context) => {
  const { pathParameters } = event

  const id = pathParameters.id
  const { userId } = event.requestContext.authorizer

  const league = await getById(id)
  if (!league) {
    throw new NotFound()
  }

  const leagueUser = league.users[userId]
  if (!leagueUser || leagueUser.role !== LeagueRole.admin) {
    throw new BadInput('You need to be part of the league and an admin to trigger a recalculation')
  }

  const newUserData = await recalculate(league)

  await sendMessage({
    QueueUrl: getQueueUrl(process.env.QUEUE_RECALCULATE, context),
    MessageBody: JSON.stringify({ leagueId: league.id }),
  })

  return {
    body: {
      ...league,
      users: newUserData,
    },
    statusCode: 200,
  }
}

export const handler = withMiddleware(league)
