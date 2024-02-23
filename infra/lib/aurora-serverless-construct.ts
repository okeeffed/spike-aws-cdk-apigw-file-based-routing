import * as rds from "aws-cdk-lib/aws-rds";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface ServerlessAuroraConstructProps {
  vpc: ec2.Vpc;
  defaultDatabaseName: string;
  dbUser?: string;
}

export class ServerlessAuroraConstruct extends Construct {
  public cluster: rds.DatabaseCluster;
  public proxy: rds.DatabaseProxy;
  public lambdaExecutionRole: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props: ServerlessAuroraConstructProps
  ) {
    super(scope, id);

    // Define the serverless Aurora DB cluster. Making this as minimal as possible
    this.cluster = new rds.DatabaseCluster(
      this,
      "ServerlessPostgresDatabaseCluster",
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_16_1,
        }),
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 1,
        readers: [
          // will be put in promotion tier 1 and will scale with the writer
          rds.ClusterInstance.serverlessV2("reader1", {
            scaleWithWriter: true,
          }),
          // will be put in promotion tier 2 and will not scale with the writer
          rds.ClusterInstance.serverlessV2("reader2"),
        ],
        instanceProps: {
          // Instance properties are required, but we minimize the configuration
          // since we're focusing on serverless' automatic scaling.
          vpc: props.vpc,
        },
        credentials: rds.Credentials.fromGeneratedSecret(
          props.dbUser ?? "admin"
        ),
        defaultDatabaseName: props.defaultDatabaseName,
      }
    );

    // Create an IAM Role for the Lambda function
    this.lambdaExecutionRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Grant the Lambda role permission to connect to the database
    // Note: dbUser relates to the spike and it not how it should be defined.
    this.cluster.grantConnect(
      this.lambdaExecutionRole,
      props.dbUser ?? "admin"
    );
  }
}
