import { Handler } from "aws-lambda";
import * as AWS from "aws-sdk";

export const handler: Handler = async (event) => {
  const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

  if (!process.env.EXAMPLE_QUEUE_URL) {
    throw new Error("EXAMPLE_QUEUE_URL is not set");
  }

  // Check if the body is present in the event
  if (!event.body) {
    console.error("No body found in the event");
    return;
  }

  const params: AWS.SQS.SendMessageRequest = {
    MessageBody: event.body,
    QueueUrl: process.env.EXAMPLE_QUEUE_URL,
  };

  try {
    const data: AWS.SQS.SendMessageResult = await sqs
      .sendMessage(params)
      .promise();
    console.log("Success", data.MessageId);
  } catch (err) {
    console.error("Error", err);
    throw err; // or handle error appropriately
  }
};
