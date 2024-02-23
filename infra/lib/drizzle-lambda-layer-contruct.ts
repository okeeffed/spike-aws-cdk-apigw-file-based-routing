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
      code: lambda.Code.fromAsset(path.join(__dirname, "layer-code")),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X], // Use lambda.Runtime for specifying the runtime
      description: "Lambda Layer containing required dependencies",
    });

    // Install dependencies in layer code directory
    const layerCodeDir = path.join(__dirname, "layer-code");
    if (!fs.existsSync(layerCodeDir)) {
      fs.mkdirSync(layerCodeDir);
    }
    fs.writeFileSync(
      path.join(layerCodeDir, "package.json"),
      JSON.stringify({
        dependencies: {
          "drizzle-orm": "^0.29.3",
          "drizzle-zod": "^0.5.1",
          pg: "^8.11.3",
          postgres: "^3.4.3",
        },
      })
    );
    fs.writeFileSync(path.join(layerCodeDir, "package-lock.json"), "{}");
    fs.writeFileSync(path.join(layerCodeDir, "index.js"), "");

    // Output ARN of the layer
    new CfnOutput(this, "LayerArn", {
      value: this.layer.layerVersionArn,
      description: "ARN of the Lambda Layer",
    });
  }
}
