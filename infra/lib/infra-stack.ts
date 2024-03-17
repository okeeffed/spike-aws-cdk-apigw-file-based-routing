import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import { ServerlessAuroraConstruct } from "./aurora-serverless-construct";
// import * as ec2 from "aws-cdk-lib/aws-ec2";
// import { DrizzleLambdaLayerConstruct } from "./drizzle-lambda-layer-contruct";
import { FileBasedApiGwConstruct } from "./file-based-apigw-construct";
import path = require("path");
import { LlrtFunction } from "cdk-lambda-llrt";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { SqsWithDlqCwConstruct } from "./sqs-with-dlq-cw-lambda-construct";
import { SqsJobsConstruct } from "./sqs-jobs-construct";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC
    // const vpc = new ec2.Vpc(this, "MyVpc");

    // const defaultDatabaseName = "serverlesstest";

    // // The code that defines your stack goes here
    // const auroraServerless = new ServerlessAuroraConstruct(
    //   this,
    //   "ServerAuroraPostgres-Test",
    //   {
    //     vpc,
    //     defaultDatabaseName,
    //     dbUser: "serverlesstest",
    //   }
    // );

    // TODO: When testing out RDS
    // const drizzleLambdaLayer = new DrizzleLambdaLayerConstruct(
    //   this,
    //   "DrizzleLambdaLayer-Test",
    // );

    // const dbConnectionUrl = `postgresql://${auroraServerless.cluster.clusterEndpoint.hostname}:${auroraServerless.cluster.clusterEndpoint.port}/${defaultDatabaseName}`;

    // Creating the queues for jobs
    const queueMap = new Map<string, Queue>();

    const exampleQueue = new SqsWithDlqCwConstruct(this, "ExampleQueue", {
      lambdas: [],
      deadLetterQueueName: "ExampleDeadLetterQueue",
      queueName: "ExampleQueue",
    });

    queueMap.set("example-queue", exampleQueue.queue);

    new FileBasedApiGwConstruct(this, "FileBasedApiGw-Test", {
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
          EXAMPLE_QUEUE_URL: exampleQueue.queue.queueUrl,
        },
      },
      logGroupProps: {
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: Specify removal policy
      },
      esbuildOptions: {
        external: ["aws-sdk"],
      },
      lambdaInputDirectoryPath: path.join(__dirname, "../../src/api"),
      lambdaOutputDirectoryPath: path.join(__dirname, "../../dist/api"),
      LambdaFunctionClass: process.env.LLRT ? LlrtFunction : NodejsFunction,
    });

    new SqsJobsConstruct(this, "SqsJobsConstruct", {
      jobsDirectoryPath: path.join(__dirname, "../../dist/jobs"),
      queueMap,
    });

    // TODO: When completed
    // new cdk.CfnOutput(this, "DBConnectionUrl", {
    //   value: dbConnectionUrl,
    //   description: "The connection URL for the database",
    // });

    // new cdk.CfnOutput(this, "DBSecretArn", {
    //   value: auroraServerless.cluster.secret?.secretArn || "",
    //   description: "The ARN of the secret containing the credentials",
    // });
  }
}
