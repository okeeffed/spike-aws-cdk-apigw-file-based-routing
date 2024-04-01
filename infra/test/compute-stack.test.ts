import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { ComputeStack } from "../stacks/compute-stack";
import { SecurityStack } from "../stacks/security-stack";
import { MonitoringStack } from "../stacks/monitoring-stack";

describe("ComputeStack", () => {
  test("Gateway stack matches snapshot", () => {
    const lambdasData = [
      {
        entry: "/api/v1/posts/GET/index.js",
        routePath: "/v1/posts",
        method: "GET",
      },
      {
        entry: "/api/v1/posts/POST/index.js",
        routePath: "/v1/posts",
        method: "POST",
      },
    ];

    const app = new cdk.App();
    const iamStack = new SecurityStack(app, "SecurityStack");
    const monitoringStack = new MonitoringStack(app, "MonitoringStack", {
      lambdasData,
      stage: "dev",
    });

    const stack = new ComputeStack(app, "ComputeStack", {
      lambdasData,
      lambdaLogGroups: monitoringStack.logGroups,
      lambdaExecutionRole: iamStack.lambdaExecutionRole,
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
