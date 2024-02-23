import * as fs from "fs";
import * as path from "path";
import { Construct } from "constructs";
import { Function, Runtime, Code, FunctionProps } from "aws-cdk-lib/aws-lambda";
import {
  RestApi,
  LambdaIntegration,
  RestApiProps,
} from "aws-cdk-lib/aws-apigateway";
import { build } from "esbuild";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { RemovalPolicy } from "aws-cdk-lib";

interface FileBasedApiGwProps {
  restApiProps: RestApiProps;
  lambdaProps?: Partial<FunctionProps>;
}

export class FileBasedApiGwConstruct extends Construct {
  restApi: RestApi;
  lambdasMap: Map<string, Function> = new Map<string, Function>();

  constructor(scope: Construct, id: string, props: FileBasedApiGwProps) {
    super(scope, id);

    const { lambdaProps = {} } = props;

    // Define the API Gateway
    this.restApi = new RestApi(this, "FileBasedApiGw", props.restApiProps);

    // Function to compile TypeScript files using ESBuild
    const compileTypeScript = async (tsFilePath: string): Promise<string> => {
      const jsFilePath = tsFilePath.replace(/\.ts$/, ".js");
      await build({
        entryPoints: [tsFilePath],
        outfile: jsFilePath,
        platform: "node",
        target: "node20",
        format: "cjs",
        bundle: true,
      });
      return jsFilePath;
    };

    // Function to recursively traverse the directory structure
    const createLambdaFunctions = async (dir: string, prefix = "") => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          // Recursively create Lambda functions for subdirectories
          const folderName = path.basename(filePath);
          const folderNameWithParam =
            folderName.startsWith("[") && folderName.endsWith("]");

          if (folderNameWithParam) {
            const paramName = folderName.substring(1, folderName.length - 1);
            await createLambdaFunctions(filePath, `${prefix}{${paramName}}/`);
          } else {
            await createLambdaFunctions(filePath, `${prefix}${folderName}/`);
          }
        } else if (filePath.endsWith(".ts")) {
          // Compile TypeScript file to JavaScript
          const jsFilePath = await compileTypeScript(filePath);

          // Extract HTTP method from file name
          const [method, functionName] = file.split(".");
          const route = `${prefix}${path.basename(
            jsFilePath,
            path.extname(jsFilePath)
          )}`;

          const logGroup = new LogGroup(
            this,
            `${functionName}${method}LogGroup`,
            {
              logGroupName: `/aws/lambda/${method}${functionName}`,
              removalPolicy: RemovalPolicy.DESTROY, // Optional: Specify removal policy
            }
          );

          // Create Lambda function for file
          const lambda = new Function(this, `${functionName}${method}`, {
            runtime: Runtime.NODEJS_20_X,
            handler: "index.handler",
            code: Code.fromAsset(path.dirname(jsFilePath)),
            logGroup,
            // Use this to attach lambdas, role, vpc and environment props
            ...lambdaProps,
          });

          // Create log group for Lambda function

          // Create API Gateway route for the Lambda function
          const apiResource = this.restApi.root.addResource(route);
          apiResource.addMethod(
            method.toUpperCase(),
            new LambdaIntegration(lambda)
          );

          // Store the Lambda function in a map
          this.lambdasMap.set(route, lambda);
        }
      }
    };

    // Start traversing the directory from src/_lambdas
    createLambdaFunctions(path.join(__dirname, "../../src/_lambdas"));
  }
}
