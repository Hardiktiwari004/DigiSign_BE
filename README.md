# Digital Signature & Document Management Platform API

## Project Overview

The **Digital Signature & Document Management Platform API** is a production-grade backend service built to facilitate secure document uploads, management, and digital signing. It provides a comprehensive suite of tools for users to authenticate, upload PDF documents, digitally sign them, track signature status, and verify the authenticity of signed documents. The system also includes an administrative interface for monitoring platform usage and auditing actions.

## Features Implemented

*   **User Authentication & Authorization**: Secure registration, login, and token-based authentication using JWT (Access & Refresh tokens). Passwords are cryptographically hashed using bcrypt.
*   **Document Management**: Users can upload PDF documents securely, retrieve their own documents, list them with filters, and track their processing status.
*   **Digital Signatures**: Add cryptographic/metadata signatures or visual signatures to PDF files using `pdf-lib`. Supports managing document signatories.
*   **Signature Verification**: A dedicated verification endpoint to validate the authenticity of previously signed documents.
*   **Admin Panel / Capabilities**: Admin-only routes to retrieve all documents across the system for monitoring and compliance.
*   **Audit Logging**: Actions within the system (e.g., document upload, signing) are logged for auditing and traceability.
*   **Security & Validation**: Implements security best practices including Helmet for HTTP headers, express-rate-limit to prevent brute-force attacks, and Zod for robust request payload validation.

## Technology Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Database**: MongoDB with Mongoose ODM
*   **Authentication**: JSON Web Tokens (JWT), bcrypt
*   **File Storage**: Cloudinary (via Multer for multipart form handling)
*   **PDF Processing**: pdf-lib
*   **Data Validation**: Zod
*   **API Documentation**: Swagger (swagger-ui-express, swagger-jsdoc)
*   **Security**: Helmet, cors, express-rate-limit

## Setup Instructions

Follow these steps to run the project locally:

1.  **Clone the repository** (if you haven't already).
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment Variables**:
    *   Copy the `.env.example` file to a new file named `.env`.
    *   Populate the `.env` file with your specific credentials (e.g., MongoDB URI, Cloudinary keys, JWT secrets).
4.  **Run in Development Mode**:
    ```bash
    npm run dev
    ```
    The server will start (default is port 5000), using `ts-node-dev` for hot-reloading.
5.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## Environment Variables

The application relies on the following environment variables (refer to `.env.example`):

*   `PORT`: The port the server will run on (default 5000).
*   `MONGO_URI`: The connection string for your MongoDB database.
*   `JWT_SECRET`: Secret key for signing short-lived access tokens.
*   `JWT_EXPIRES_IN`: Expiration time for access tokens (e.g., `15m`).
*   `JWT_REFRESH_SECRET`: Secret key for signing long-lived refresh tokens.
*   `JWT_REFRESH_EXPIRES_IN`: Expiration time for refresh tokens (e.g., `7d`).
*   `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name.
*   `CLOUDINARY_API_KEY`: Your Cloudinary API key.
*   `CLOUDINARY_API_SECRET`: Your Cloudinary API secret.
*   `CLIENT_URL`: The URL of the frontend application (for CORS configuration).
*   `NODE_ENV`: The environment mode (`development`, `production`).

## Architecture Overview

The application follows a structured **Service-Oriented MVC Architecture** to ensure separation of concerns and maintainability:

*   **Routes (`src/routes`)**: Define API endpoints and map them to corresponding controller methods. Route-level middleware handles authentication and validation.
*   **Controllers (`src/controllers`)**: Handle incoming HTTP requests, extract parameters, and pass data to the service layer. They return formatted HTTP responses.
*   **Services (`src/services`)**: Contain the core business logic (e.g., interacting with the database, processing PDFs, uploading to Cloudinary).
*   **Models (`src/models`)**: Define the Mongoose schemas and data structures for MongoDB.
*   **Validators (`src/validators`)**: Zod schemas used in middleware to validate incoming request bodies, params, and queries.
*   **Middleware (`src/middleware`)**: Intercept requests for authentication, error handling, rate limiting, etc.

## Database Design

The database consists of the following primary collections:

1.  **Users (`User`)**: Stores user credentials, roles (`user`, `admin`), and profile information.
2.  **Documents (`Document`)**: Stores document metadata, including the Cloudinary file URL, owner reference, and document status (e.g., `pending`, `signed`).
3.  **Signatures (`Signature`)**: Records digital signatures, linking the user who signed the document, the document ID, timestamp, and signature payload data.
4.  **Refresh Tokens (`RefreshToken`)**: Securely stores refresh tokens mapped to users for persistent authentication sessions.
5.  **Audit Logs (`AuditLog`)**: Tracks system-level actions tied to users and documents for traceability.

## API Overview

The API is prefixed with `/api`. Below are the primary route groupings:

*   **Auth (`/api/auth`)**: Endpoints for user registration, login, logout, retrieving current user (`/me`), and refreshing JWT tokens.
*   **Documents (`/api/documents`)**: Endpoints for uploading, retrieving, and listing documents.
*   **Signatures (`/api/documents/:id/sign`)**: Endpoints dedicated to the digital signing of a specific document.
*   **Verification (`/api/verify`)**: Endpoint(s) to verify the integrity and signature authenticity of a document.
*   **Admin (`/api/admin`)**: Restricted endpoints for administrators to view system-wide data (e.g., retrieving all documents).
*   **Health Check (`/health`)**: Public endpoint to check server health status.

> **API Documentation**: Detailed interactive documentation is available via Swagger UI. Start the server and navigate to `/api-docs` (e.g., `http://localhost:5000/api-docs`).

## Deployment Information

The application is built to be easily containerizable or deployed to PaaS providers (e.g., Render, Heroku, AWS Elastic Beanstalk):

1.  Ensure all Environment Variables are configured in the deployment environment.
2.  The build script (`npm run build`) compiles TypeScript to JavaScript in the `dist` folder.
3.  The start script (`npm start`) runs the compiled `dist/server.js`.
4.  Ensure MongoDB is accessible from the deployment environment (e.g., MongoDB Atlas).
5.  Cloudinary is used for cloud storage, eliminating the need for persistent local file storage on the server.

## Assumptions Made

*   Users are uploading valid PDF files. Other file formats are rejected or not supported for signing.
*   Cloudinary is used purely as an object store. The raw file URLs are stored in MongoDB.
*   A client application (frontend) resides at the URL specified in `CLIENT_URL` and sends requests with credentials (cookies or Authorization headers).
*   The `pdf-lib` library is sufficient for current signing needs (metadata embedding or visual text stamping).

## Known Limitations

*   **File Size Limits**: File uploads are processed in memory (via Multer) before streaming to Cloudinary. Extremely large files might cause memory spikes. The JSON body parser is currently limited to 5MB.
*   **Complex Digital Signatures**: The current digital signature implementation relies on `pdf-lib`. It may not support complex cryptographic PKI (Public Key Infrastructure) certificate-based signatures natively without additional third-party cryptographic wrappers.
*   **Rate Limiting**: Rate limiting is currently in-memory. In a multi-instance (horizontally scaled) deployment, a distributed store like Redis would be required for accurate rate limiting.

## Future Improvements

*   **Email Notifications**: Integrate a service (e.g., SendGrid, AWS SES) to send emails when a document is shared or requires a signature.
*   **OAuth2 Integration**: Allow users to sign up and log in using third-party providers like Google or GitHub.
*   **WebSocket Integration**: Implement real-time updates for document status changes (e.g., notifying a user immediately when their document is signed).
*   **Advanced Signature Placement**: Allow users to drag-and-drop or specify exact X/Y coordinates for visual signature placement on the PDF.
*   **Two-Factor Authentication (2FA)**: Enhance security by adding a second layer of authentication during login or before signing a document.
*   **Redis Integration**: Offload session/refresh-token management and rate-limiting to Redis for better performance and horizontal scalability.
