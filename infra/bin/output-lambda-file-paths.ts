import * as fs from "fs";
import * as path from "path";

const lambdasMap = new Map<string, any>();
const LAMBDA_DIRECTORY_PATH = path.join(__dirname, "../../dist/api");
const OUTPUT_FILE_PATH = path.join(__dirname, "../data/api-lambdas.json");

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

async function createLambdaFunctions({
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

      await createLambdaFunctions({
        dir: filePath,
        prefix: `${prefix}${folderName}/`,
      });
    } else if (filePath.endsWith(".js")) {
      await createApiGwEndpoint({
        inputFilePath: filePath,
      });
    }
  }
}

/**
 * Creates the API resource based on the TypeScript file.
 * This includes the lambda and associated log groups.
 */
async function createApiGwEndpoint({
  inputFilePath,
}: {
  inputFilePath: string;
}) {
  const method = parseMethod({ inputFilePath });
  const routePath = parseApiResourcePath({ inputFilePath });

  // Store the Lambda function in a map
  lambdasMap.set(`${routePath}-${method}`, {
    method,
    routePath,
    entry: inputFilePath.replace(path.resolve("../dist"), ""),
  });
}

function parseMethod({ inputFilePath }: { inputFilePath: string }): HttpMethod {
  try {
    const pathToInputFileArr = inputFilePath.split("/");

    // Extract HTTP method from parent folder
    const parentFolderName = pathToInputFileArr[pathToInputFileArr.length - 2];

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
 * String manipulation helper to create the API resource path.
 */
function parseApiResourcePath({
  inputFilePath,
}: {
  inputFilePath: string;
}): string {
  // Only parse the routes from the given output dir file
  const filePathFromLambdaRoot = inputFilePath.replace(
    LAMBDA_DIRECTORY_PATH,
    ""
  );

  // Extract HTTP method from file name
  const pathsToMethod = filePathFromLambdaRoot.split("/");
  pathsToMethod.pop(); // Remove the last element which is the file name
  pathsToMethod.pop(); // Remove the last element which is now the method

  const routePath = pathsToMethod.join("/");

  return routePath;
}

async function main() {
  await createLambdaFunctions({
    dir: LAMBDA_DIRECTORY_PATH,
    prefix: "",
  });

  fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify([...lambdasMap], null, 2));
}

main();
