#!/bin/bash

# Exit on any errors
set -e

echo "Running AWS CDK destroy command in the infra directory..."
(
	cd infra || exit
	npm run cdk destroy --all
)

echo "Teardown complete."
