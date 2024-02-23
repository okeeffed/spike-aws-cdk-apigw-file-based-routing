import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ServerlessAuroraConstruct } from "./aurora-serverless-construct";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { DrizzleLambdaLayerConstruct } from "./drizzle-lambda-layer-contruct";
import { FileBasedApiGwConstruct } from "./file-based-apigw-construct";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC
    const vpc = new ec2.Vpc(this, "MyVpc");

    const defaultDatabaseName = "test-serverless";

    // The code that defines your stack goes here
    const auroraServerless = new ServerlessAuroraConstruct(
      this,
      "ServerAuroraPostgres-Test",
      {
        vpc,
        defaultDatabaseName,
        dbUser: "admin",
      }
    );

    const drizzleLambdaLayer = new DrizzleLambdaLayerConstruct(
      this,
      "DrizzleLambdaLayer-Test"
    );

    const dbConnectionUrl = `postgresql://${auroraServerless.cluster.clusterEndpoint.hostname}:${auroraServerless.cluster.clusterEndpoint.port}/${defaultDatabaseName}`;

    new FileBasedApiGwConstruct(this, "FileBasedApiGw-Test", {
      restApiProps: {
        restApiName: "file-based-api-gw-test",
      },
      lambdaProps: {
        layers: [drizzleLambdaLayer.layer],
        role: auroraServerless.lambdaExecutionRole,
        vpc,
        environment: {
          DB_CONNECTION_URL: dbConnectionUrl, // The constructed URL
          DB_SECRET_ARN: auroraServerless.cluster.secret?.secretArn || "", // The ARN of the secret containing the credentials
        },
      },
    });
  }
}
