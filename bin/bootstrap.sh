#!/bin/bash

# # Step 1: Run docker compose up
# echo "Starting LocalStack with Docker Compose..."
# docker compose up -d

# # Step 2: Wait for LocalStack to be ready
# echo "Waiting for LocalStack to be ready..."
# while ! curl -s http://localhost:4566/_localstack/health | grep -q '"dynamodb": "available"'; do
# 	echo "Waiting for LocalStack..."
# 	sleep 5
# done
# echo "LocalStack is ready."

aws-vault exec personal --no-session

# Step 3: Run AWS CDK commands in the infra directory
echo "Running AWS CDK commands in the infra directory..."
(
	cd infra || exit
	npm run cdk-local synth --all
	npm run cdk-local bootstrap --all
	npm run cdk-local deploy --all
)

# Example bash script snippet
# domainName=$(AWS_REGION=ap-southeast-2 AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 cloudformation describe-stacks --stack-name DynamoESStack --query "Stacks[0].Outputs[?OutputKey=='DomainNameOutput'].OutputValue" --output text)
# echo "{\"OPENSEARCH_ENDPOINT\": \"${domainName}\"}" >env.json

# Step 4: Create the index
# echo "Creating index..."
# pnpm create-index

# Step 5: Run the seed code
# echo "Running seed code..."
# pnpm seed

echo "Please update .env.local with the DB_CONNECTION_URL and DB_SECRET_ARN"

echo "Setup complete."
