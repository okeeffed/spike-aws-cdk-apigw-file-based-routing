import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import { ServerlessAuroraConstruct } from "./aurora-serverless-construct";
// import * as ec2 from "aws-cdk-lib/aws-ec2";
// import { DrizzleLambdaLayerConstruct } from "./drizzle-lambda-layer-contruct";
import { LambdaData } from "../types";
import { ApplicationStack } from "./application-stack";
import { HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";

interface ApplicationStackProps extends cdk.StackProps {
  lambdasData: LambdaData[];
  applicationStack: ApplicationStack;
}

export class GatewayStack extends cdk.Stack {
  public restApi: HttpApi;

  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    // Instantiate an HTTP API
    const httpApi = new HttpApi(this, "MyHttpApi", {
      apiName: "file-based-api-gw-test",
    });

    for (const lambdaData of props.lambdasData) {
      const lambdaFn = props.applicationStack.fileBasedApiGw.lambdasMap.get(
        lambdaData.entry
      );

      if (!lambdaFn) {
        throw new Error(
          `Lambda function not found for entry: ${lambdaData.entry}`
        );
      }

      // Add routes to the HTTP API
      httpApi.addRoutes({
        path: lambdaData.routePath,
        methods: [
          HttpMethod[
            lambdaData.method.toUpperCase() as keyof typeof HttpMethod
          ],
        ],
        integration: new integrations.HttpLambdaIntegration(
          `${lambdaData.entry}Integration`,
          lambdaFn
        ),
      });
    }
  }
}
