import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { SecurityStack } from "../stacks/security-stack";

describe("SecurityStack", () => {
  test("Gateway stack matches snapshot", () => {
    const app = new cdk.App();
    const stack = new SecurityStack(app, "SecurityStack");
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
