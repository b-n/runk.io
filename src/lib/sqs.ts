import { config as AWSConfig, SQS } from 'aws-sdk'
import SQSClient from 'aws-sdk/clients/sqs'
import { Context } from 'aws-lambda'

import config from '../../config'

AWSConfig.update({
  region: process.env.REGION,
})

const sqs = new SQS({
  apiVersion: '2012-11-05',
  ...config.sqs,
})

const sendMessage =
  async (params: SQS.SendMessageRequest):
Promise<SQSClient.SendMessageResult> =>
    sqs.sendMessage(params).promise()

const getQueueUrl = (queueName: string, context: Context) => {
  return `${config.sqsUrl(context)}/${queueName}`
}

export {
  sendMessage,
  getQueueUrl,
}
