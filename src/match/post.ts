import 'source-map-support/register'
import Joi from '@hapi/joi'
import difference from 'lodash/difference'
import uniqBy from 'lodash/uniqBy'

import { BadInput, NotFound } from '../lib/errors'
import { validateRequest } from '../lib/validation'
import { withMiddleware, Handler } from '../lib/middleware'
import { calculateNewRatings, EloOutcome } from '../lib/elo'

import { getById, updateScores, ScoreUpdate } from '../repositories/league'
import { create } from '../repositories/match'

const league: Handler = async (event) => {
  const { body, pathParameters } = event

  if (!body) {
    throw new BadInput('Requires a body')
  }

  const leagueId = pathParameters && pathParameters.leagueId

  if (!leagueId) {
    throw new BadInput('requires a leagueId')
  }

  const newMatch: Match = validateRequest(
    JSON.parse(body),
    Joi.object({
      date: Joi.string().isoDate().required(),
      winner: Joi.number().only().allow(0, 1, 2).required(),
      users: Joi.object({})
        .pattern(
          Joi.string().uuid(),
          Joi.object({
            team: Joi.number().only().allow(1, 2).required(),
          }).required(),
          {
            matches: Joi.array().length(2),
          }
        )
        .required(),
    }),
    { ErrorClass: BadInput }
  )
  const { userId } = event.requestContext.authorizer

  const league = await getById(leagueId)

  if (!league.users[userId] || !league.users[userId].isActive) {
    throw new NotFound()
  }

  const nonExistantUsers = difference(
    Object.keys(newMatch.users),
    Object.keys(league.users)
  )

  if (nonExistantUsers.length > 0) {
    throw new BadInput(`User(s): ${nonExistantUsers.join(',')} are not part of the league`)
  }

  if (Object.keys(newMatch.users).length !== 2 || uniqBy(Object.values(newMatch.users), user => user.team).length !== 2) {
    throw new BadInput('There should be exactly 2 teams of 1 member each')
  }

  const existingScores: Array<number> = []

  const userInfo = Object.keys(newMatch.users).map(userId => {
    const user = {
      ...newMatch.users[userId],
      id: userId,
      score: league.users[userId].score,
    }
    existingScores[user.team - 1] = user.score
    return user
  })

  const newScores = calculateNewRatings(
    existingScores[0],
    existingScores[1],
    getEloOutcome(newMatch.winner)
  )

  const scoreUpdates: Array<ScoreUpdate> = []
  userInfo.map(user => {
    const { id, score, team } = user
    const newScore = newScores[team - 1]
    newMatch.users[id].previousElo = score
    newMatch.users[id].elo = newScore
    scoreUpdates.push({
      id,
      score: newScore,
    })
  })

  const match = await create({
    ...newMatch,
    leagueId,
  })

  await updateScores(leagueId, scoreUpdates)

  return {
    body: match,
    statusCode: 200,
  }
}

const getEloOutcome = (winner: number): EloOutcome => {
  if (winner === 0) return EloOutcome.DRAW
  if (winner === 1) return EloOutcome.CHALLENGER
  return EloOutcome.OPPONENT
}

export const handler = withMiddleware(league)
