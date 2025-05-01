#!/bin/bash

# Script to create a super admin user

# Navigate to project root directory
cd "$(dirname "$0")/.." || exit

# Check if TypeScript is installed
if ! command -v tsc &> /dev/null; then
  echo "TypeScript is not installed. Installing..."
  npm install -g typescript
fi

# Compile the TypeScript file
echo "Compiling TypeScript..."
npx tsc scripts/create-admin.ts --esModuleInterop

# Run the compiled JavaScript file
echo "Running admin creation script..."
node scripts/create-admin.js

# Clean up the compiled JavaScript file (optional)
echo "Cleaning up..."
rm scripts/create-admin.js

echo "Done!"