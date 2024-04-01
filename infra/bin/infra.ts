#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApplicationStack } from "../stacks/application-stack";
import { MonitoringStack } from "../stacks/monitoring-stack";
import baseContext from "../cdk.json";
import lambdasData from "../data/api-lambdas.json";
import { GatewayStack } from "../stacks/gateway-stack";

const context = {
  ...baseContext,
  "aws:cdk:bundling-stacks": [],
};

const app = new cdk.App(context);
const stage = app.node.tryGetContext("stage") || "dev";

const monitoringStack = new MonitoringStack(
  app,
  "LambdaFileRouterTestMonitoringStack",
  {
    lambdasData,
    stage,
  }
);

const applicationStack = new ApplicationStack(app, "LambdaFileRouterTest", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  lambdasData,
  lambdaLogGroups: monitoringStack.logGroups,
});

new GatewayStack(app, "LambdaFileRouterTestGatewayStack", {
  lambdasData,
  applicationStack,
});
