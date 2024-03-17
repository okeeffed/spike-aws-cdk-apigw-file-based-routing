import * as fs from "fs";
import * as path from "path";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  RestApi,
  LambdaIntegration,
  RestApiProps,
} from "aws-cdk-lib/aws-apigateway";
import { ILogGroup, LogGroup, LogGroupProps } from "aws-cdk-lib/aws-logs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Function } from "aws-cdk-lib/aws-lambda";
import { LlrtFunction, LlrtFunctionProps } from "cdk-lambda-llrt";

interface FileBasedApiGwProps {
  lambdaDirectoryPath: string;
  restApiProps: RestApiProps;
  LambdaFunctionClass: typeof NodejsFunction | typeof LlrtFunction;
  lambdaProps?: Partial<NodejsFunctionProps> | Partial<LlrtFunctionProps>;
  logGroupProps?: LogGroupProps;
  logGroupNameSuffix?: string;
}

type HttpMethod =
  | "DELETE"
  | "GET"
  | "HEAD"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT";

function isHttpMethod(str: string): str is HttpMethod {
  return ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"].includes(
    str
  );
}

function removeSpecialCharacters(input: string): string {
  return input.replace(
    // replace all special characters
    /[^a-zA-Z0-9]/g,
    ""
  );
}

/**
 * Create an API Gateway, then recursively create the
 * API resources based on the file directory of the lambda input directory path.
 * Each resource created includes the lambda and associated log group.
 */
export class FileBasedApiGwConstruct extends Construct {
  public restApi: RestApi;
  public lambdasMap: Map<string, Function> = new Map<string, Function>();
  #LambdaFunctionClass: FileBasedApiGwProps["LambdaFunctionClass"];
  #lambdaProps: FileBasedApiGwProps["lambdaProps"];
  #logGroupProps: FileBasedApiGwProps["logGroupProps"];
  #lambdaDirectoryPath: FileBasedApiGwProps["lambdaDirectoryPath"];
  #logGroupNameSuffix: FileBasedApiGwProps["logGroupNameSuffix"];

  constructor(scope: Construct, id: string, props: FileBasedApiGwProps) {
    super(scope, id);

    this.#LambdaFunctionClass = props.LambdaFunctionClass;
    this.#lambdaProps = props.lambdaProps ?? {};
    this.#lambdaDirectoryPath = props.lambdaDirectoryPath;
    this.#logGroupNameSuffix = props.logGroupNameSuffix;

    // Define the API Gateway
    this.restApi = new RestApi(this, "FileBasedApiGw", props.restApiProps);

    // Start traversing the directory from this input path
    this.createLambdaFunctions({
      dir: this.#lambdaDirectoryPath,
      prefix: "",
    });
  }

  /**
   * Read any given directory.
   * If path is a directory, recursively check that directory.
   * If path is a .ts file, invoke call to create api resource, lambda + log groups.
   */
  private async createLambdaFunctions({
    dir,
    prefix,
  }: {
    dir: string;
    prefix: string;
  }) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // Recursively create Lambda functions for subdirectories
        const folderName = path.basename(filePath);

        await this.createLambdaFunctions({
          dir: filePath,
          prefix: `${prefix}${folderName}/`,
        });
      } else if (filePath.endsWith(".js")) {
        await this.createApiGwEndpoint({
          inputFilePath: filePath,
        });
      }
    }
  }

  /**
   * Create the Nodejs lambda or LLRT lambda based on props.
   */
  private constructLambdaFunction({
    method,
    routePath,
    logGroup,
    entry,
  }: {
    method: string;
    routePath: string;
    logGroup: ILogGroup;
    entry: string;
  }) {
    // Handle NodejsFunction
    return new this.#LambdaFunctionClass(this, `${method}${routePath}`, {
      runtime: Runtime.NODEJS_20_X,
      handler: `handler`,
      entry,
      logGroup,
      // Use this to attach lambdas, role, vpc and environment props
      // or even just make some overrides
      ...this.#lambdaProps,
    });
  }

  private parseMethod({
    inputFilePath,
  }: {
    inputFilePath: string;
  }): HttpMethod {
    try {
      const pathToInputFileArr = inputFilePath.split("/");

      // Extract HTTP method from parent folder
      const parentFolderName =
        pathToInputFileArr[pathToInputFileArr.length - 2];

      if (!isHttpMethod(parentFolderName)) {
        throw new Error(
          `Parent folder ${parentFolderName} at ${inputFilePath} is not of type HttpMethod`
        );
      }

      return parentFolderName;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Invalid method name error: ${err.message}`);
      } else {
        throw new Error(
          `Error occured when trying to parse method. Valid methods include `
        );
      }
    }
  }

  /**
   * Creates the API resource based on the TypeScript file.
   * This includes the lambda and associated log groups.
   */
  private async createApiGwEndpoint({
    inputFilePath,
  }: {
    inputFilePath: string;
  }) {
    const method = this.parseMethod({ inputFilePath });
    const routePath = this.parseApiResourcePath({ inputFilePath });

    // Used for the CloudWatch Logs
    const logGroupId = removeSpecialCharacters(`${method}${routePath}LogGroup`);
    const logGroupName = removeSpecialCharacters(
      `/aws/lambda/${routePath}${method}${
        this.#logGroupNameSuffix ? `-${this.#logGroupNameSuffix}` : ""
      }`
    );

    // Create log group for Lambda function
    const logGroup = new LogGroup(this, logGroupId, {
      logGroupName: logGroupName,
      ...this.#logGroupProps,
    });

    const lambda = this.constructLambdaFunction({
      method,
      routePath,
      entry: inputFilePath,
      logGroup,
    });

    // Create API Gateway route for the Lambda function
    const apiResource = this.restApi.root.resourceForPath(routePath);
    apiResource.addMethod(method.toUpperCase(), new LambdaIntegration(lambda));

    // Store the Lambda function in a map
    this.lambdasMap.set(`${routePath}-${method}`, lambda);
  }

  /**
   * String manipulation helper to create the API resource path.
   */
  private parseApiResourcePath({
    inputFilePath,
  }: {
    inputFilePath: string;
  }): string {
    // Only parse the routes from the given output dir file
    const filePathFromLambdaRoot = inputFilePath.replace(
      this.#lambdaDirectoryPath,
      ""
    );

    // Extract HTTP method from file name
    const pathsToMethod = filePathFromLambdaRoot.split("/");
    pathsToMethod.pop(); // Remove the last element which is the file name
    pathsToMethod.pop(); // Remove the last element which is now the method

    const routePath = pathsToMethod.join("/");

    return routePath;
  }
}
