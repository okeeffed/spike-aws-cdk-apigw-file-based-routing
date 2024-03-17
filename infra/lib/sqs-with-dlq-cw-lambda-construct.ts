import * as fs from "fs";
import * as path from "path";
import { Construct } from "constructs";
import { Queue, QueueProps } from "aws-cdk-lib/aws-sqs";
import { LogGroup } from "aws-cdk-lib/aws-logs";

interface SqsWithDlqCwProps {
  jobsDirectoryPath: string;
  queueProps?: QueueProps;
  deadLetterQueueProps?: QueueProps;
}

export class SqsWithDlqCwConstruct extends Construct {
  public queueMap = new Map<string, Queue>();
  public logGroup: LogGroup;

  constructor(scope: Construct, id: string, props: SqsWithDlqCwProps) {
    super(scope, id);

    this.recursivelyCreateQueues({
      props,
      prefix: "",
    });
  }

  private recursivelyCreateQueues({
    props,
    prefix,
  }: {
    props: SqsWithDlqCwProps;
    prefix: string;
  }) {
    const dir = `${props.jobsDirectoryPath}/${prefix}`;
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // Recursively create Lambda functions for subdirectories
        const folderName = path.basename(filePath);

        this.recursivelyCreateQueues({
          props,
          prefix: `${prefix}${folderName}/`,
        });
      } else if (file.endsWith(".js")) {
        // Get job name from file path
        const pathToFileArr = filePath.split("/");
        const jobName = pathToFileArr[pathToFileArr.length - 2];
        const dlqName = `${jobName}-dlq`;

        // Create DLQ
        const deadLetterQueue = new Queue(this, dlqName, {
          queueName: dlqName,
          ...(props.deadLetterQueueProps ?? {}),
        });

        // Create main queue with DLQ as its dead letter queue
        const queue = new Queue(this, jobName, {
          queueName: jobName,
          deadLetterQueue: {
            queue: deadLetterQueue,
            maxReceiveCount: 5, // adjust based on your needs
          },
        });

        this.queueMap.set(jobName, queue);
        this.queueMap.set(dlqName, deadLetterQueue);
      }
    }
  }
}
