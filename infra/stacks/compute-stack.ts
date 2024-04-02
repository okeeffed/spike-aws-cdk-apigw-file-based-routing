import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import { ServerlessAuroraConstruct } from "./aurora-serverless-construct";
// import * as ec2 from "aws-cdk-lib/aws-ec2";
// import { DrizzleLambdaLayerConstruct } from "./drizzle-lambda-layer-contruct";
import { FileBasedApiGwConstruct } from "../lib/file-based-apigw-construct";
import path = require("path");
import { LlrtFunction } from "cdk-lambda-llrt";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaData } from "../types";
import * as logs from "aws-cdk-lib/aws-logs";
import { Role } from "aws-cdk-lib/aws-iam";

interface ComputeStackProps extends cdk.StackProps {
  lambdasData: LambdaData[];
  lambdaLogGroups: Map<string, logs.LogGroup>;
  lambdaExecutionRole: Role;
}

export class ComputeStack extends cdk.Stack {
  public fileBasedApiGw: FileBasedApiGwConstruct;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Creating the queues for jobs
    // const jobQueues = new SqsWithDlqCwConstruct(this, "ExampleQueue", {
    //   jobsDirectoryPath: path.join(__dirname, "../../dist/jobs"),
    // });

    // const exampleQueue = jobQueues.queueMap.get("example-queue") as Queue;

    this.fileBasedApiGw = new FileBasedApiGwConstruct(
      this,
      "FileBasedApiGw-Test",
      {
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
            // EXAMPLE_QUEUE_URL: exampleQueue.queueUrl,
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
          },
          role: props.lambdaExecutionRole,
        },
        lambdaDirectoryPath: path.join(__dirname, "../../dist"),
        LambdaFunctionClass: process.env.LLRT ? LlrtFunction : NodejsFunction,
        lambdasData: props.lambdasData,
        lambdaLogGroups: props.lambdaLogGroups,
      }
    );
  }
}
