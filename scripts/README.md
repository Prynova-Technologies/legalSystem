# Admin User Creation Script

This directory contains a script to generate a super admin user with login credentials for the law management system.

## Prerequisites

Make sure you have Node.js and npm installed on your system.

## Usage

### Option 1: Using the Shell Script (Recommended)

1. Make sure your MongoDB instance is running and accessible
2. Make sure all dependencies are installed:
   ```
   npm install
   ```
3. Run the shell script:
   ```
   ./scripts/create-admin.sh
   ```
   This script will automatically compile the TypeScript file and run it.

### Option 2: Manual Execution

1. Make sure your MongoDB instance is running and accessible
2. Make sure all dependencies are installed:
   ```
   npm install
   ```
3. Compile the TypeScript script:
   ```
   npx tsc scripts/create-admin.ts --esModuleInterop
   ```
   If you encounter any issues, you may need to install TypeScript globally:
   ```
   npm install -g typescript
   ```
4. Run the compiled script:
   ```
   node scripts/create-admin.js
   ```

## Default Admin Credentials

The script will create a super admin with the following default credentials:

- **Email**: admin@lawfirm.com
- **Password**: Admin@123

**Important**: For security reasons, you should change the default password in the script before running it in a production environment.

## What the Script Does

- Checks if a super admin with the specified email already exists
- If not, creates a new super admin user with ADMIN role
- Outputs the login credentials to the console