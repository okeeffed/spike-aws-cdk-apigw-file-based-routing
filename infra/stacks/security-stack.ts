import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { LambdaData } from "../types";

export interface SecurityStackProps extends cdk.StackProps {
  lambdasData: LambdaData[];
}

export class SecurityStack extends cdk.Stack {
  public lambdaExecutionRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    this.lambdaExecutionRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "An execution role for Lambda functions",
    });

    // Step 2: Attach the AWSLambdaBasicExecutionRole policy to the role
    this.lambdaExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
  }
}
