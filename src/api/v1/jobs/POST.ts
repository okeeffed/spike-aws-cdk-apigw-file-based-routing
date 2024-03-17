import { Handler } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// Create an SQS client
export const handler: Handler = async (event) => {
  const client = new SQSClient({
    region: "ap-southeast-2", // for example, "us-west-2"
  });

  if (!process.env.EXAMPLE_QUEUE_URL) {
    throw new Error("EXAMPLE_QUEUE_URL is not set");
  }

  // Check if the body is present in the event
  if (!event.body) {
    console.error("No body found in the event");
    return;
  }

  try {
    const command = new SendMessageCommand({
      MessageBody: event.body,
      QueueUrl: process.env.EXAMPLE_QUEUE_URL,
    });
    const data = await client.send(command);

    console.log("Success", data.MessageId);

    const response = {
      statusCode: 201, // HTTP status code
      headers: {
        "Content-Type": "application/json", // Ensure the client knows to expect JSON
      },
    };

    return response;
  } catch (err) {
    console.error("Error", err);
    throw err; // or handle error appropriately
  }
};
