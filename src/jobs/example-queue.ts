import type { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  event.Records.forEach((record: any) => {
    console.log("Record: %j", record);
  });
};
