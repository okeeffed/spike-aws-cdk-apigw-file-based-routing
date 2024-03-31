import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import { ServerlessAuroraConstruct } from "./aurora-serverless-construct";
// import * as ec2 from "aws-cdk-lib/aws-ec2";
// import { DrizzleLambdaLayerConstruct } from "./drizzle-lambda-layer-contruct";
import { FileBasedApiGwConstruct } from "../lib/file-based-apigw-construct";
import path = require("path");
import { LlrtFunction } from "cdk-lambda-llrt";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { SqsWithDlqCwConstruct } from "../lib/sqs-with-dlq-cw-lambda-construct";
import { SqsJobsConstruct } from "../lib/sqs-jobs-construct";
import { LambdaData } from "../types";
import * as logs from "aws-cdk-lib/aws-logs";

interface ApplicationStackProps extends cdk.StackProps {
  lambdasData: LambdaData[];
  lambdaLogGroups: Map<string, logs.LogGroup>;
}

export class ApplicationStack extends cdk.Stack {
  public fileBasedApiGw: FileBasedApiGwConstruct;

  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    // Creating the queues for jobs
    const jobQueues = new SqsWithDlqCwConstruct(this, "ExampleQueue", {
      jobsDirectoryPath: path.join(__dirname, "../../dist/jobs"),
    });

    const exampleQueue = jobQueues.queueMap.get("example-queue") as Queue;

    this.fileBasedApiGw = new FileBasedApiGwConstruct(
      this,
      "FileBasedApiGw-Test",
      {
        restApiProps: {
          restApiName: "file-based-api-gw-test",
        },
        lambdaProps: {
          // TODO: When testing out RDS
          // layers: [drizzleLambdaLayer.layer],
          // TODO: When completed
          // role: auroraServerless.lambdaExecutionRole,
          // vpc,
          environment: {
            // DB_CONNECTION_URL: dbConnectionUrl, // The constructed URL
            // DB_SECRET_ARN: auroraServerless.cluster.secret?.secretArn || "", // The ARN of the secret containing the credentials

            // Note: this will only be accessible by the Lambda function that has the correct permissions
            EXAMPLE_QUEUE_URL: exampleQueue.queueUrl,
          },
        },
        lambdaDirectoryPath: path.join(__dirname, "../../dist/api"),
        LambdaFunctionClass: process.env.LLRT ? LlrtFunction : NodejsFunction,
        lambdasData: props.lambdasData,
        lambdaLogGroups: props.lambdaLogGroups,
      }
    );

    const jobToLambda = {
      "example-queue": this.fileBasedApiGw.lambdasMap.get("/v1/jobs-POST"),
    };

    for (const [queueName, lambda] of Object.entries(jobToLambda)) {
      if (!lambda) {
        throw new Error("Lambda not found for job");
      }

      const queue = jobQueues.queueMap.get(queueName);
      if (!queue) {
        throw new Error("Queue not found for job");
      }

      queue.grantSendMessages(lambda);
    }

    new SqsJobsConstruct(this, "SqsJobsConstruct", {
      jobsDirectoryPath: path.join(__dirname, "../../dist/jobs"),
      queueMap: jobQueues.queueMap,
    });
  }
}
