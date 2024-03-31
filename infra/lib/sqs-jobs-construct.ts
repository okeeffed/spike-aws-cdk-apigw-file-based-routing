import * as fs from "fs";
import * as path from "path";
import { Construct } from "constructs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, LogGroupProps } from "aws-cdk-lib/aws-logs";
import { LlrtFunctionProps } from "cdk-lambda-llrt";

interface JobBasedLambdaProps {
  jobsDirectoryPath: string;
  queueMap: Map<string, Queue>;
  lambdaProps?: Partial<NodejsFunctionProps> | Partial<LlrtFunctionProps>;
}

export class SqsJobsConstruct extends Construct {
  #queueMap: JobBasedLambdaProps["queueMap"];
  #lambdaProps: JobBasedLambdaProps["lambdaProps"];

  constructor(scope: Construct, id: string, props: JobBasedLambdaProps) {
    super(scope, id);

    this.#queueMap = props.queueMap;
    this.#lambdaProps = props.lambdaProps ?? {};

    this.createLambdasAndQueues({
      dir: props.jobsDirectoryPath,
      prefix: "",
    });
  }

  private createLambdasAndQueues({
    dir,
    prefix,
  }: {
    dir: string;
    prefix: string;
  }) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // Recursively create Lambda functions for subdirectories
        const folderName = path.basename(filePath);

        this.createLambdasAndQueues({
          dir: filePath,
          prefix: `${prefix}${folderName}/`,
        });
      } else if (file.endsWith(".js")) {
        // Get the function name from the parent folder
        const filePathArr = filePath.split("/");
        const functionName = filePathArr[filePathArr.length - 2];

        const queue = this.#queueMap.get(functionName);

        if (!queue) {
          throw new Error(`Queue for ${functionName} not found`);
        }

        // // Used for the CloudWatch Logs
        // const logGroupId = `Job${functionName}LogGroup`;
        // const logGroupName = `/aws/lambda/Job${functionName}${
        //   this.#logGroupNameSuffix ? `-${this.#logGroupNameSuffix}` : ""
        // }`;

        // // Create log group for Lambda function
        // const logGroup = new LogGroup(this, logGroupId, {
        //   logGroupName: logGroupName,
        //   ...this.#logGroupProps,
        // });

        // Create the Lambda function for the job
        const lambda = new NodejsFunction(this, `${functionName}Lambda`, {
          runtime: Runtime.NODEJS_20_X,
          handler: "handler",
          entry: filePath,
          // logGroup,
          ...this.#lambdaProps,
        });

        // Add the SQS queue as an event source for the Lambda function
        lambda.addEventSource(new SqsEventSource(queue));
      }
    }
  }
}
