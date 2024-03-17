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
  logGroupNameSuffix?: string;
  logGroupProps?: LogGroupProps;
  lambdaProps?: Partial<NodejsFunctionProps> | Partial<LlrtFunctionProps>;
}

export class SqsJobsConstruct extends Construct {
  #logGroupProps: JobBasedLambdaProps["logGroupProps"];
  #queueMap: JobBasedLambdaProps["queueMap"];
  #lambdaProps: JobBasedLambdaProps["lambdaProps"];
  #logGroupNameSuffix: JobBasedLambdaProps["logGroupNameSuffix"];

  constructor(scope: Construct, id: string, props: JobBasedLambdaProps) {
    super(scope, id);

    this.#logGroupProps = props.logGroupProps;
    this.#queueMap = props.queueMap;
    this.#lambdaProps = props.lambdaProps ?? {};
    this.#logGroupNameSuffix = props.logGroupNameSuffix;

    this.createLambdasAndQueues(props.jobsDirectoryPath);
  }

  private createLambdasAndQueues(jobsDirectoryPath: string) {
    const files = fs.readdirSync(jobsDirectoryPath);

    files.forEach((file) => {
      if (file.endsWith(".js")) {
        const functionName = file.replace(".js", "");
        const filePath = path.join(jobsDirectoryPath, file);

        const queue = this.#queueMap.get(functionName);

        if (!queue) {
          throw new Error(`Queue for ${functionName} not found`);
        }

        // Used for the CloudWatch Logs
        const logGroupId = `Job${functionName}LogGroup`;
        const logGroupName = `/aws/lambda/Job${functionName}${
          this.#logGroupNameSuffix ? `-${this.#logGroupNameSuffix}` : ""
        }`;

        // Create log group for Lambda function
        const logGroup = new LogGroup(this, logGroupId, {
          logGroupName: logGroupName,
          ...this.#logGroupProps,
        });

        // Create the Lambda function for the job
        const lambda = new NodejsFunction(this, `${functionName}Lambda`, {
          runtime: Runtime.NODEJS_20_X,
          handler: "handler",
          entry: filePath,
          logGroup,
          ...this.#lambdaProps,
        });

        // Add the SQS queue as an event source for the Lambda function
        lambda.addEventSource(new SqsEventSource(queue));
      }
    });
  }
}
