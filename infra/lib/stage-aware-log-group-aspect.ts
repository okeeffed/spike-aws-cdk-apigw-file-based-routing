import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as constructs from "constructs";

function removeSpecialCharacters(input: string): string {
  return input.replace(
    // replace all special characters
    /[^a-zA-Z0-9]/g,
    ""
  );
}

export class StageAwareLambdaLogGroupAspect implements cdk.IAspect {
  constructor(private stage: string) {}

  public visit(node: constructs.IConstruct): void {
    if (node instanceof lambda.Function) {
      const functionName = removeSpecialCharacters(node.functionName);
      const logGroupName = `/aws/lambda/${this.stage}-${functionName}`;

      new logs.LogGroup(node, `${functionName}LogGroup`, {
        logGroupName,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }
  }
}
