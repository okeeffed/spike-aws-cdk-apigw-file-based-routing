import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import { ServerlessAuroraConstruct } from "./aurora-serverless-construct";
// import * as ec2 from "aws-cdk-lib/aws-ec2";
// import { DrizzleLambdaLayerConstruct } from "./drizzle-lambda-layer-contruct";
import { FileBasedApiGwConstruct } from "./file-based-apigw-construct";
import path = require("path");
import { LlrtFunction } from "cdk-lambda-llrt";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

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
        // environment: {
        //   DB_CONNECTION_URL: dbConnectionUrl, // The constructed URL
        //   DB_SECRET_ARN: auroraServerless.cluster.secret?.secretArn || "", // The ARN of the secret containing the credentials
        // },
      },
      logGroupProps: {
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: Specify removal policy
      },
      esbuildOptions: {
        external: ["aws-sdk"],
      },
      lambdaInputDirectoryPath: path.join(__dirname, "../../src/_lambdas"),
      lambdaOutputDirectoryPath: path.join(__dirname, "../../dist/_lambdas"),
      LambdaFunctionClass: process.env.LLRT ? LlrtFunction : NodejsFunction,
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
