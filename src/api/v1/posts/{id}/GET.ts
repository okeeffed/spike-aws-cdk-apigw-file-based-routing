import { APIGatewayProxyHandler } from "aws-lambda";

interface LambdaEvent {
  pathParameters: { [key: string]: string | undefined } | null;
  queryStringParameters: { [key: string]: string | undefined } | null;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

export const handler: APIGatewayProxyHandler = async (
  event: LambdaEvent,
): Promise<LambdaResponse> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Success",
      pathParam: event.pathParameters,
      queryParam: event.queryStringParameters,
    }),
  };
};
