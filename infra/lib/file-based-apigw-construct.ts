import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  RestApi,
  LambdaIntegration,
  RestApiProps,
} from "aws-cdk-lib/aws-apigateway";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Function } from "aws-cdk-lib/aws-lambda";
import { LlrtFunction, LlrtFunctionProps } from "cdk-lambda-llrt";
import * as path from "path";
import { LambdaData } from "../types";
import { LogGroup } from "aws-cdk-lib/aws-logs";

interface FileBasedApiGwProps {
  lambdaDirectoryPath: string;
  restApiProps: RestApiProps;
  LambdaFunctionClass: typeof NodejsFunction | typeof LlrtFunction;
  lambdaProps?: Partial<NodejsFunctionProps> | Partial<LlrtFunctionProps>;
  lambdasData: LambdaData[];
  lambdaLogGroups: Map<string, LogGroup>;
}

/**
 * Create an API Gateway, then recursively create the
 * API resources based on the file directory of the lambda input directory path.
 * Each resource created includes the lambda and associated log group.
 */
export class FileBasedApiGwConstruct extends Construct {
  public restApi: RestApi;
  public lambdasMap: Map<string, Function> = new Map<string, Function>();
  private LambdaFunctionClass: FileBasedApiGwProps["LambdaFunctionClass"];
  private lambdaProps: FileBasedApiGwProps["lambdaProps"];
  private lambdaLogGroups: FileBasedApiGwProps["lambdaLogGroups"];

  constructor(scope: Construct, id: string, props: FileBasedApiGwProps) {
    super(scope, id);

    this.LambdaFunctionClass = props.LambdaFunctionClass;
    this.lambdaProps = props.lambdaProps ?? {};
    this.lambdaLogGroups = props.lambdaLogGroups;

    // Define the API Gateway
    this.restApi = new RestApi(this, "FileBasedApiGw", props.restApiProps);

    for (const lambdaData of props.lambdasData) {
      this.createApiGwEndpoint(lambdaData);
    }
  }

  /**
   * Creates the API resource based on the TypeScript file.
   * This includes the lambda and associated log groups.
   */
  private async createApiGwEndpoint({ routePath, method, entry }: LambdaData) {
    const lambdaFn = new this.LambdaFunctionClass(
      this,
      `${method}${routePath}`,
      {
        runtime: Runtime.NODEJS_20_X,
        handler: `handler`,
        entry: path.resolve("../../dist", entry),
        logGroup: this.lambdaLogGroups.get(entry),
        // Use this to attach lambdas, role, vpc and environment props
        // or even just make some overrides
        ...this.lambdaProps,
      }
    );

    // Create API Gateway route for the Lambda function
    const apiResource = this.restApi.root.resourceForPath(routePath);
    apiResource.addMethod(
      method.toUpperCase(),
      new LambdaIntegration(lambdaFn)
    );

    // Store the Lambda function in a map
    this.lambdasMap.set(entry, lambdaFn);
  }
}
