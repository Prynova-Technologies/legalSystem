# Law Firm Management System Backend

A comprehensive backend system for law firms to manage cases, clients, documents, tasks, billing, and more.

## Features

- **Core Case Management**: Create, edit, and track cases with unique identifiers and categorization
- **Client Management**: Maintain client profiles with contact information and case linkage
- **Document Management**: Secure storage, organization, and sharing of legal documents
- **Task and Calendar Management**: Track deadlines, court dates, and assignments
- **Time Tracking and Billing**: Record billable hours and generate invoices
- **Communication**: Internal messaging and client portal integration
- **Security**: Role-based access control and data protection
- **Reporting and Analytics**: Generate insights on case status and performance
- **Integration**: Connect with email, calendar, and accounting systems

## Tech Stack

- Node.js & Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- Helmet for security headers
- Winston for logging
- Joi for validation

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── interfaces/     # TypeScript interfaces
├── middlewares/    # Express middlewares
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/law-firm-management
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=30d
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## API Documentation

API documentation will be available at `/api-docs` when the server is running.

## Security Features

- HTTP security headers with Helmet
- Rate limiting to prevent brute force attacks
- Data sanitization against NoSQL query injection
- XSS protection
- Parameter pollution prevention
- Secure JWT authentication

## License

ISC