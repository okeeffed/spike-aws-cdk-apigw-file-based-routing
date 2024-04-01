import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import { LambdaData } from "../types";

interface MonitoringStackProps extends cdk.StackProps {
  stage: string;
  lambdasData: LambdaData[];
}

function removeSpecialCharacters(input: string): string {
  return input.replace(
    // replace all special characters
    /[^a-zA-Z0-9]/g,
    ""
  );
}

export class MonitoringStack extends cdk.Stack {
  public logGroups: Map<string, logs.LogGroup> = new Map<
    string,
    logs.LogGroup
  >();
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    props.lambdasData.forEach((data) => {
      const functionName = removeSpecialCharacters(
        `${data.routePath}-${data.method}`
      );
      const logGroupName = `/aws/lambda/${props.stage}-${functionName}`;

      const logGroup = new logs.LogGroup(this, `${functionName}LogGroup`, {
        logGroupName: logGroupName,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      this.logGroups.set(data.entry, logGroup);
    });
  }
}
