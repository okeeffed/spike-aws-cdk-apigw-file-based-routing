import * as fs from "fs";
import * as path from "path";
import { Construct } from "constructs"; // Import Construct from 'constructs' instead of '@aws-cdk/core'
import { aws_lambda as lambda, CfnOutput } from "aws-cdk-lib"; // Use aws-cdk-lib and structured imports for AWS services

export class DrizzleLambdaLayerConstruct extends Construct {
  // Expose the layer as a property
  public layer: lambda.LayerVersion;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create Lambda Layer
    this.layer = new lambda.LayerVersion(this, "Layer", {
      code: lambda.Code.fromAsset(path.join(__dirname, "drizzle-layer")),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X], // Use lambda.Runtime for specifying the runtime
      description: "Lambda Layer containing required dependencies",
    });

    // Output ARN of the layer
    new CfnOutput(this, "LayerArn", {
      value: this.layer.layerVersionArn,
      description: "ARN of the Lambda Layer",
    });
  }
}
