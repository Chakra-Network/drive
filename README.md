# Chakra Drive

Chakra Drive is a decentralized file storage and sharing platform built on the Solana blockchain. This README provides instructions on how to set up and run the project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [API Endpoints](#api-endpoints)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or later)
- npm (v6 or later)
- PostgreSQL (v12 or later)
- Solana CLI tools
- Git

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/chakra-drive.git
   cd chakra-drive
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Database Setup

1. Install PostgreSQL if you haven't already.

2. Create a new database for Chakra Drive:

   ```
   createdb chakra_drive
   ```

3. The application uses Prisma as an ORM. To set up the database schema, run:

   ```
   npx prisma migrate dev
   ```

   This command will create the necessary tables in your database.

## Environment Configuration

1. Create a `.env` file in the root directory of the project.

2. Add the following environment variables to the `.env` file:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/chakra_drive"
   JWT_SECRET="your-secret-key"
   NEXT_PUBLIC_IRYS_NODE_URL="https://node1.irys.xyz"
   NEXT_PUBLIC_RPC_URL="https://api.mainnet-beta.solana.com"
   ```

   Replace `username`, `password`, and other placeholder values with your actual configuration.

## Running the Application

1. Start the development server:

   ```
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`.

## API Endpoints

The application provides several API endpoints for file and user management. Here are some key endpoints:

- `POST /api/user/login`: User login
- `GET /api/file`: List files
- `POST /api/file`: Upload a file
- `GET /api/folder`: List folders
- `POST /api/folder`: Create a new folder

For a complete list of endpoints and their usage, refer to the API documentation or the route files in the `src/app/api` directory.

## Testing

To run the test suite:

```
npm test
```

This will execute the tests defined in `src/test/test.ts`.

## Troubleshooting

- If you encounter database connection issues, ensure that your PostgreSQL server is running and that the `DATABASE_URL` in your `.env` file is correct.
- For Solana-related issues, make sure your wallet is properly funded and that the `SOLANA_PRIVATE_KEY_PATH` is correct.
- If you have issues with Irys uploads, check that your Solana wallet has sufficient balance and that the `IRYS_NODE_URL` is accessible.

For more detailed troubleshooting, refer to the error messages in the console or server logs.

---

For additional help or to report issues, please open an issue on the GitHub repository.
