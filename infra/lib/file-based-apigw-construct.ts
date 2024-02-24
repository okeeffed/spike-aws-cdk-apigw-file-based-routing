import * as fs from "fs";
import * as path from "path";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  RestApi,
  LambdaIntegration,
  RestApiProps,
} from "aws-cdk-lib/aws-apigateway";
import { build } from "esbuild";
import { ILogGroup, LogGroup, LogGroupProps } from "aws-cdk-lib/aws-logs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Function } from "aws-cdk-lib/aws-lambda";
import { LlrtFunction, LlrtFunctionProps } from "cdk-lambda-llrt";

interface FileBasedApiGwProps {
  lambdaInputDirectoryPath: string;
  lambdaOutputDirectoryPath: string;
  restApiProps: RestApiProps;
  LambdaFunctionClass: typeof NodejsFunction | typeof LlrtFunction;
  lambdaProps?: Partial<NodejsFunctionProps> | Partial<LlrtFunctionProps>;
  logGroupProps?: LogGroupProps;
  esbuildOptions?: {
    external?: string[];
  };
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

function getFileNameWithoutExtension(filePath: string): string {
  // Get the base name of the file
  const basename = path.basename(filePath);

  // Find the last occurrence of "." to get the file extension
  const lastDotIndex = basename.lastIndexOf(".");

  // If there's no dot or it's the first character, return the base name as it is
  if (lastDotIndex <= 0) {
    return basename;
  }

  // Otherwise, return the substring from the start to the last dot
  return basename.substring(0, lastDotIndex);
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
  #esbuildOptions: FileBasedApiGwProps["esbuildOptions"];
  #lambdaInputDirectoryPath: FileBasedApiGwProps["lambdaInputDirectoryPath"];
  #lambdaOutputDirectoryPath: FileBasedApiGwProps["lambdaOutputDirectoryPath"];

  constructor(scope: Construct, id: string, props: FileBasedApiGwProps) {
    super(scope, id);

    this.#LambdaFunctionClass = props.LambdaFunctionClass;
    this.#lambdaProps = props.lambdaProps ?? {};
    this.#esbuildOptions = props.esbuildOptions ?? {};
    this.#lambdaInputDirectoryPath = props.lambdaInputDirectoryPath;
    this.#lambdaOutputDirectoryPath = props.lambdaOutputDirectoryPath;

    // Define the API Gateway
    this.restApi = new RestApi(this, "FileBasedApiGw", props.restApiProps);

    // Start traversing the directory from this input path
    this.createLambdaFunctions({
      dir: this.#lambdaInputDirectoryPath,
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
      } else if (filePath.endsWith(".ts")) {
        await this.createApiGwEndpoint({
          tsFilePath: filePath,
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

  private parseMethod({ tsFilePath }: { tsFilePath: string }): HttpMethod {
    try {
      const fileName = getFileNameWithoutExtension(tsFilePath);

      if (!isHttpMethod(fileName)) {
        throw new Error(
          `Filename ${fileName} at ${tsFilePath} is not of type HttpMethod`
        );
      }

      return fileName;
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

  private async compileTypeScript({ tsFilePath }: { tsFilePath: string }) {
    // naive approach to finding the method
    const method = this.parseMethod({ tsFilePath });

    const jsFilePath = tsFilePath
      .replace(this.#lambdaInputDirectoryPath, this.#lambdaOutputDirectoryPath)
      .replace(/\.ts$/, ".js");

    // This is the name of the file when converted into a index file for the output dir
    const outfile = path.resolve(path.dirname(jsFilePath), method, "index.js");

    // Effectively running esbuild <tsFilePath> --platform=node --target=es2020 --outfile=<outfile> --format=esm --bundle --minify
    await build({
      entryPoints: [tsFilePath],
      outfile: outfile,
      platform: "node",
      target: "es2020",
      format: "esm",
      bundle: true,
      minify: true,
      ...this.#esbuildOptions,
    });
    return { outfile, method };
  }

  /**
   * Creates the API resource based on the TypeScript file.
   * This includes the lambda and associated log groups.
   */
  private async createApiGwEndpoint({ tsFilePath }: { tsFilePath: string }) {
    // Compile TypeScript file to JavaScript
    const { outfile, method } = await this.compileTypeScript({
      tsFilePath,
    });

    const routePath = this.parseApiResourcePath({ outfile });

    // Used for the CloudWatch Logs
    const logGroupId = removeSpecialCharacters(`${method}${routePath}LogGroup`);
    const logGroupName = removeSpecialCharacters(
      `/aws/lambda/${routePath}${method}`
    );

    // Create log group for Lambda function
    const logGroup = new LogGroup(this, logGroupId, {
      logGroupName: logGroupName,
      ...this.#logGroupProps,
    });

    const lambda = this.constructLambdaFunction({
      method,
      routePath,
      entry: outfile,
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
  private parseApiResourcePath({ outfile }: { outfile: string }): string {
    // Only parse the routes from the given output dir file
    const filePathFromLambdaRoot = outfile.replace(
      this.#lambdaOutputDirectoryPath,
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
