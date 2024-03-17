import { Construct } from "constructs";
import { Queue, QueueProps } from "aws-cdk-lib/aws-sqs";
import { Function } from "aws-cdk-lib/aws-lambda";
import { LogGroup } from "aws-cdk-lib/aws-logs";

interface SqsWithDlqCwProps {
  /** Add list of lambdas that should have sendMessage permissions for the queue */
  lambdas: Function[];
  deadLetterQueueName: string;
  queueName: string;
  queueProps?: QueueProps;
  deadLetterQueueProps?: QueueProps;
}

export class SqsWithDlqCwConstruct extends Construct {
  public queue: Queue;
  public deadLetterQueue: Queue;
  public logGroup: LogGroup;

  constructor(scope: Construct, id: string, props: SqsWithDlqCwProps) {
    super(scope, id);

    // Create DLQ
    this.deadLetterQueue = new Queue(this, props.deadLetterQueueName, {
      queueName: props.deadLetterQueueName,
      ...(props.deadLetterQueueProps ?? {}),
    });

    // Create main queue with DLQ as its dead letter queue
    this.queue = new Queue(this, props.queueName, {
      queueName: props.queueName,
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: 5, // adjust based on your needs
      },
      ...(props.queueProps ?? {}),
    });

    // Grant permissions to the provided Lambda functions to send messages to the queue
    props.lambdas.forEach((lambda) => {
      this.queue.grantSendMessages(lambda);
    });
  }
}
